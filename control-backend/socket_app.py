import asyncio
import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from kasa import Discover, SmartStrip
from kasa.exceptions import SmartDeviceException

from eventlet import GreenPool


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://example.com"]}})
socketio = SocketIO(app, cors_allowed_origins="*")

def start_asyncio_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_forever()

eventlet.spawn_n(start_asyncio_loop)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('request_device_status')
def handle_device_status_request(json_data):
    print(json_data)
    def bridge_coroutine_to_eventlet(coro):
        future = asyncio.run_coroutine_threadsafe(coro, asyncio.get_event_loop())
        return future.result()

    async def async_device_status_request_handler(json_data):
        response = []
        for device_info in json_data:
            ip = device_info.get('ip')
            socket_no = device_info.get('socket_number', None)
            try:
                device = await Discover.discover_single(ip)
                await device.update()
                device_status = {
                    "name": device_info.get('name'),
                    "ip": ip,
                    "device_type": device_info.get('device_type'),
                    "is_on": device.is_on,
                    "is_child": False,
                    "socket_number": socket_no
                }

                if isinstance(device, SmartStrip) and socket_no is not None:
                    child_device = device.children[socket_no]
                    device_status["is_on"] = child_device.is_on
                    device_status["is_child"] = True

                try:
                    energy_usage = await device.current_consumption()
                    device_status["energy_usage"] = energy_usage
                except SmartDeviceException:
                    pass  # Device does not support energy monitoring, or other error occurred

                response.append(device_status)
            except Exception as e:
                print(f"Error querying device at {ip}: {e}")
                response.append({
                    "name": device_info.get('name'),
                    "ip": ip,
                    "error": f"Failed to query device: {e}"
                })

        socketio.emit('device_status_response', response)



    
    eventlet.spawn_n(bridge_coroutine_to_eventlet, async_device_status_request_handler(json_data))

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=8000)