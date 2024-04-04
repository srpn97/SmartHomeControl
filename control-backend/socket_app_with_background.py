# Socket App with background task running to get continous updates

import asyncio
import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from kasa import Discover, SmartStrip
from kasa.exceptions import SmartDeviceException
from eventlet import tpool

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://example.com"]}})
socketio = SocketIO(app, cors_allowed_origins="*")

latest_device_info = None  # Global variable to store the latest JSON data received
is_background_task_running = False  # Flag to check if the background task is running

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
    global latest_device_info, is_background_task_running
    latest_device_info = json_data
    print(json_data)

    # Start the background task only if it's not already running
    if not is_background_task_running:
        socketio.start_background_task(background_update_task)
        is_background_task_running = True

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

    return response

def background_update_task():
    global latest_device_info
    while True:
        if latest_device_info is not None:
            def execute_async_coro():
                # Create a new event loop for the coroutine since we can't use the running one
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                # Run the coroutine to completion and get the result
                response = loop.run_until_complete(async_device_status_request_handler(latest_device_info))
                loop.close()
                return response

            def send_updates():
                # Use tpool.execute to run the synchronous function that executes the coroutine
                response = tpool.execute(execute_async_coro)
                socketio.emit('device_status_response', response)

            send_updates()
            socketio.sleep(5)  # Wait for 5 seconds before sending the next update
        else:
            socketio.sleep(1)  # Short sleep if there's no data

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=8000)
