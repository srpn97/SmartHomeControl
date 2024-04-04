# Server Using FastAPI


from fastapi import FastAPI, WebSocket, HTTPException, Body
from typing import Optional, List
from pydantic import BaseModel
import asyncio
from kasa import Discover, SmartStrip
import json
from fastapi import WebSocketDisconnect
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

allowed_origins = [
    "http://localhost:3000",  # Allow web applications hosted on localhost:3000
    "*",    # Allow a web application hosted at example.com
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # List of allowed methods
    allow_headers=["X-Custom-Header"],  # List of allowed headers
)

connections: List[WebSocket] = []

class DeviceControlData(BaseModel):  # Pydantic models to validate request bodies
    action: str
    ip: str
    socket_number: Optional[int] = None

class DeviceInfoData(BaseModel):
    device_type: str
    id: int
    ip: str
    is_strip_child: bool
    model: str
    name: str
    parent_ip: str
    socket_number: int
    selected: Optional[bool] = None 

# Your async functions remain largely unchanged
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

@app.get("/devices")
async def list_devices():
    devices = await get_devices()
    return devices

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

@app.post("/device/control")
async def device_control(data: DeviceControlData):
    if data.action not in ['on', 'off']:
        raise HTTPException(status_code=400, detail="Invalid action")
    success = await control_device(data.action, data.ip, data.socket_number)
    return {"success": success}

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

async def get_device_status(device_info: DeviceInfoData):
    ip = device_info.ip  # Direct attribute access
    socket_no = device_info.socket_number  # Direct attribute access, can be None if not provided
    device = await Discover.discover_single(ip)
    await device.update()

    # Initialize the base device info with existing data and update the status
    updated_device_info = device_info.dict()
    updated_device_info['is_on'] = device.is_on

    # Handle SmartStrip children specifically
    if device_info.is_strip_child and socket_no is not None:
        child_device = device.children[socket_no]
        updated_device_info['is_on'] = child_device.is_on

    return updated_device_info


async def get_device_statuses(devices_info):
    tasks = [get_device_status(device_info) for device_info in devices_info]
    return await asyncio.gather(*tasks)

@app.post("/device/details")
async def device_details(devices_info: List[DeviceInfoData]):
    updated_devices_info = await get_device_statuses(devices_info)
    return updated_devices_info

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     global connections  # Use global keyword if you're modifying the global variable, not necessary for append
#     await websocket.accept()
#     connections.append(websocket)  # This should work as connections is now properly defined
#     try:
#         while True:
#             data = await websocket.receive_text()
#             # Process received data and potentially send responses
#             # Example: echo back the received message
#             await websocket.send_text(f"Message text was: {data}")
#     except WebSocketDisconnect:
#         connections.remove(websocket)
#         print("Client disconnected")

# async def get_device_statuses(devices_info):
#     # Assuming devices_info is a list of DeviceInfoData like objects
#     tasks = [get_device_status(DeviceInfoData(**device_info)) for device_info in devices_info]
#     updated_devices_info = await asyncio.gather(*tasks)
#     return updated_devices_info

