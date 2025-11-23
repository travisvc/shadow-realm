import bittensor as bt
from config import Logger

logger = Logger.get_logger(__name__)

logger.info("The shadow trader is running...")

subtensor = bt.subtensor(network="wss://archive.chain.opentensor.ai:443")

coldkey = "5DoAKfL58HSgynPxM1mUpyw8Fm6wS9PREZcCj4Heooq5uN4B"
hotkey = "5GKH9FPPnWSUoeeTJp19wVtd84XqFW4pyK2ijV2GsFbhTrP1" # taostats validator
netuid = 66

# coldkey_hotkey_stake = subtensor.get_stake_for_coldkey_and_hotkey(coldkey_ss58=coldkey, hotkey_ss58=hotkey)
# print(coldkey_hotkey_stake)

# coldkey_stake = subtensor.get_stake_for_coldkey(coldkey_ss58=coldkey)
# print(coldkey_stake)

while True:
    subtensor.wait_for_block()

    current_block = subtensor.get_current_block()
    timestamp = subtensor.get_timestamp(block=current_block)
    price = subtensor.get_subnet_price(netuid=netuid, block=current_block)
    logger.info(f"Timestamp: {timestamp} - Block: {current_block} - Price: {price}")

    last_stake_block = subtensor.query_subtensor('LastColdkeyHotkeyStakeBlock', params=[coldkey, hotkey]).value
    logger.info(f"Last stake block: {last_stake_block}")

    if current_block == last_stake_block:
        logger.info("Staked")
    else:
        logger.debug("Not staked")
