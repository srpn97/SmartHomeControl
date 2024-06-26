# Original Implementation with Flask

from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
from kasa import Discover, SmartBulb, SmartPlug, SmartStrip

app = Flask(__name__)
CORS(app)


async def get_devices():
    devices = await Discover.discover()
    detailed_devices = []
    device_id = 0  # Initialize a counter for device ID

    for ip, device in devices.items():
        await device.update()  # Ensure we have the latest state
        device_type = type(device).__name__  # Get the class name as a string for device type
        if isinstance(device, SmartStrip):
            # Only include each child socket of the power strip, omitting the power strip itself
            for index, child in enumerate(device.children):
                detailed_devices.append({
                    "id": device_id,
                    "ip": ip,
                    "name": child.alias,
                    "socket_number": index,  # Include the socket number for easy reference
                    "is_strip_child": True,
                    "parent_ip": ip,
                    "model": device.model,
                    "device_type": "SmartStripChild"
                })
                device_id += 1  # Increment the ID for the next child socket
        else:
            # Include other devices normally with an ID
            detailed_devices.append({
                "id": device_id,
                "ip": ip,
                "name": device.alias,
                "model": device.model,
                "device_type": device_type
            })
            device_id += 1  # Increment the ID for the next device

    return detailed_devices

@app.route('/devices', methods=['GET'])
def list_devices():
    devices = asyncio.run(get_devices())
    return jsonify(devices)

async def control_device(action, ip, socket_number=None):
    devices = await Discover.discover()
    if ip in devices:
        device = devices[ip]
        await device.update()

        # If a socket number is provided and the device is a SmartStrip, control the child socket
        if socket_number is not None and isinstance(device, SmartStrip):
            child_device = device.children[socket_number]  # Access the specific child socket
            if action == 'on':
                await child_device.turn_on()
            elif action == 'off':
                await child_device.turn_off()
        else:
            # Control the device directly if it's not a SmartStrip child or no socket number is provided
            if action == 'on':
                await device.turn_on()
            elif action == 'off':
                await device.turn_off()
        
        return True
    return False

@app.route('/device/control', methods=['POST'])
def device_control():
    data = request.json
    action = data.get('action')
    ip = data.get('ip')
    socket_number = data.get('socket_number', None)  # Optional

    if action not in ['on', 'off']:
        return jsonify({"error": "Invalid action"}), 400
    
    success = asyncio.run(control_device(action, ip, socket_number))
    return jsonify({"success": success})

async def get_device_details(ip):
    devices = await Discover.discover()
    if ip in devices:
        device = devices[ip]
        await device.update()  # Ensure we have the latest data

        # Basic device details
        details = {
            "alias": device.alias,
            "model": device.model,
            "is_on": device.is_on,
            "device_type": device.device_type.name,
            "ip": ip,
        }

        # Add more device-specific details
        if isinstance(device, SmartPlug):
            details.update({
                "is_plug": True,
                "has_energy_monitor": device.has_emeter,
                # Add other SmartPlug specific attributes here
            })
        elif isinstance(device, SmartBulb):
            details.update({
                "is_bulb": True,
                "brightness": device.brightness if device.is_dimmable else None,
                "color_temp": device.color_temp if device.is_variable_color_temp else None,
                # Add other SmartBulb specific attributes here
            })

        # Adding device-specific details for a power strip
        if device.device_type == device.device_type.Strip:
            details.update({
                "LED_state": device.led,  # Assuming 'device.led' is accessible, adjust based on actual API
                "childs_count": len(device.children),
                "on_since": device.on_since.isoformat() if device.is_on else None,  # Format datetime as ISO string
            })

        return details
    else:
        return None

async def get_device_status(device_info):
    ip = device_info.get('ip')
    socket_no = device_info.get('socket_number', None)
    device = await Discover.discover_single(ip)
    await device.update()

    # Update the base device info with the status
    device_info['is_on'] = device.is_on

    # Handle SmartStrip children specifically
    if device_info.get('is_strip_child') and socket_no is not None:
        child_device = device.children[socket_no]
        device_info['is_on'] = child_device.is_on

    return device_info

def get_device_statuses(devices_info):
    async def async_get_device_statuses(devices_info):
        tasks = [get_device_status(device_info) for device_info in devices_info]
        return await asyncio.gather(*tasks)

    return asyncio.run(async_get_device_statuses(devices_info))


@app.route('/device/details', methods=['POST'])
def device_details():
    devices_info = request.json
    updated_devices_info = get_device_statuses(devices_info)
    return jsonify(updated_devices_info)

if __name__ == '__main__':
    app.run(debug=True)