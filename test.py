import requests

base_url = "http://localhost:8000"

# Get latest ticks
response = requests.get(f"{base_url}/ticks", params={"limit": 5})
print(f"Latest ticks: {len(response.json())}")

# Get ticks count
response = requests.get(f"{base_url}/ticks/count")
print(f"Total ticks: {response.json()}")

# Get ticks from last 24 hours
response = requests.get(f"{base_url}/ticks", params={"hours": 24})
print(f"Ticks last 24h: {len(response.json())}")

# Get ticks by date/time range
response = requests.get(
    f"{base_url}/ticks",
    params={
        "start_date": "2025-11-24",
        "start_time": "04:00:00",
        "end_date": "2025-11-24",
        "end_time": "05:12:00"
    }
)
print(f"Ticks in range: {len(response.json())}")

# Get latest extrinsics
response = requests.get(f"{base_url}/extrinsics", params={"limit": 5})
print(f"Latest extrinsics: {len(response.json())}")

# Get extrinsics count
response = requests.get(f"{base_url}/extrinsics/count")
print(f"Total extrinsics: {response.json()}")

# Get extrinsics from last 12 hours
response = requests.get(f"{base_url}/extrinsics", params={"hours": 12})
print(f"Extrinsics last 12h: {len(response.json())}")

# Get extrinsics by date/time range
response = requests.get(
    f"{base_url}/extrinsics",
    params={
        "start_date": "2025-11-23",
        "start_time": "12:00:00",
        "end_date": "2025-11-24",
        "end_time": "17:00:00"
    }
)
print(f"Extrinsics in range: {len(response.json())}")