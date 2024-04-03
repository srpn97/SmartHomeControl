from flask import Flask, request, jsonify
from flask_cors import CORS
# from flask_socketio import SocketIO, emit
import asyncio
from kasa import Discover, SmartBulb, SmartPlug, SmartStrip

app = Flask(__name__)
CORS(app)

# socketio = SocketIO(app, cors_allowed_origins="*")

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

async def control_device(action, ip):
    devices = await Discover.discover()
    if ip in devices:
        device = devices[ip]
        await device.update()
        if action == 'on':
            await device.turn_on()
        elif action == 'off':
            await device.turn_off()
        return True
    return False

@app.route('/device/<action>/<ip>', methods=['POST'])
def device_control(action, ip):
    if action not in ['on', 'off']:
        return "Invalid action", 400
    success = asyncio.run(control_device(action, ip))
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

@app.route('/device/details/<ip>', methods=['GET'])
def device_details(ip):
    details = asyncio.run(get_device_details(ip))
    if details:
        return jsonify(details)
    else:
        return "Device not found", 404

# @socketio.on('request_device_status', namespace='/socket')
# async def handle_device_status_request(json_data):
#     response = []
#     for device_info in json_data:
#         ip = device_info.get('ip')
#         socket_no = device_info.get('socket', None)
#         device = await Discover.discover_single(ip)
#         await device.update()
#         device_status = {
#             "name": device_info.get('name'),
#             "ip": ip,
#             "is_on": device.is_on
#         }

#         # Check if it's a SmartStrip and socket_no is provided
#         if isinstance(device, SmartStrip) and socket_no is not None:
#             child_device = device.children[socket_no]
#             device_status["is_on"] = child_device.is_on  # Update with child device's status

#         # Add energy monitoring details if available
#         if hasattr(device, "emeter_realtime"):
#             energy_usage = await device.current_consumption()
#             device_status["energy_usage"] = energy_usage

#         # Include other relevant details you need
#         # ...

#         response.append(device_status)

#     await emit('device_status_response', response, namespace='/socket')

if __name__ == '__main__':
    app.run(debug=True)