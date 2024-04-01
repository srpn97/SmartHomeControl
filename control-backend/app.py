from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
from kasa import Discover

app = Flask(__name__)
CORS(app)

async def get_devices():
    devices = await Discover.discover()
    return devices

@app.route('/devices', methods=['GET'])
def list_devices():
    devices = asyncio.run(get_devices())
    device_list = [{"ip": ip, "name": device.alias} for ip, device in devices.items()]
    return jsonify(device_list)

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

if __name__ == '__main__':
    app.run(debug=True)
