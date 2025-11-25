import bittensor as bt
from logger import Logger
from db import Extrinsic, Tick, Database
from typing import Dict, Optional


COLDKEY = "5DoAKfL58HSgynPxM1mUpyw8Fm6wS9PREZcCj4Heooq5uN4B"

db = Database()
logger = Logger.get_logger(__name__)
subtensor = bt.subtensor(network="wss://archive.chain.opentensor.ai:443")



def calculate_portfolio_balance(subtensor: bt.subtensor, coldkey: str) -> Dict[str, str]:
    """ Calculate the total portfolio balance including free balance and staked amounts. """
    free_balance = subtensor.get_balance(coldkey)
    coldkey_stake = subtensor.get_stake_for_coldkey(coldkey_ss58=coldkey)
    
    root_staked_rao = 0
    alpha_staked_rao = 0
    
    for stake_object in coldkey_stake:
        price = subtensor.get_subnet_price(netuid=stake_object.netuid)
        
        if stake_object.netuid == 0:
            root_staked_rao += (stake_object.stake.rao * price.rao) // 1_000_000_000
        else:
            alpha_staked_rao += (stake_object.stake.rao * price.rao) // 1_000_000_000

    root_staked = bt.Balance.from_rao(int(root_staked_rao))
    alpha_staked = bt.Balance.from_rao(int(alpha_staked_rao))
    total_balance = free_balance + root_staked + alpha_staked

    return {'total': str(total_balance), 'free': str(free_balance), 'root': str(root_staked), 'alpha': str(alpha_staked)}


def detect_trade_signal(call_function: str) -> Optional[str]:
    if call_function == "add_stake_limit":
        return 'BUY'
    elif call_function == "remove_stake_limit":
        return 'SELL'
    return None


def process_trade_signal(signal: str, call_function: str) -> None:
    if signal == 'BUY':
        logger.info(f"Trade signal detected: {call_function} - Executing BUY order")
    elif signal == 'SELL':
        logger.info(f"Trade signal detected: {call_function} - Executing SELL order")



def main():
    logger.info("Welcome to the Shadow Realm!")    

    while True:
        try:
            subtensor.wait_for_block()

            # Process tick in this block
            current_block = subtensor.get_current_block()
            timestamp = subtensor.get_timestamp(block=current_block)
            balance = calculate_portfolio_balance(subtensor, COLDKEY)
            logger.info(f"Processing tick - Block: {current_block}, Timestamp: {timestamp}")
            
            # Save tick to database
            tick = Tick(block_number=current_block, timestamp=timestamp, balance=balance)
            db.save(tick)
            
            # Process extrinsics in this block
            block_hash = subtensor.get_block_hash(current_block)
            block = subtensor.substrate.get_block(block_hash=block_hash)
            extrinsics = block.get('extrinsics', [])
            
            for extrinsic in extrinsics:
                if COLDKEY not in str(extrinsic):
                    continue
                
                logger.info("Relevant extrinsic found for coldkey")
                value = extrinsic.value
                call = value['call']
                call_function = call['call_function']
                
                signal = detect_trade_signal(call_function)
                
                if signal:
                    process_trade_signal(signal, call_function)
                    
                    # Save extrinsic to database
                    args = {arg['name']: arg['value'] for arg in call['call_args']}
    
                    extrinsic = Extrinsic(
                        block_number=current_block,
                        timestamp=timestamp,
                        address=value['address'],
                        call_module=call['call_module'],
                        call_function=call_function,
                        hotkey=args.get('hotkey'),
                        netuid=args.get('netuid'),
                        amount=args.get('amount_staked') if call_function == "add_stake_limit" else args.get('amount_unstaked'),
                        limit_price=args.get('limit_price'),
                    )
                    db.save(extrinsic)
                    logger.info("Extrinsic saved to database")
                else:
                    logger.debug(f"Non-trading extrinsic detected: {call_function} - Skipping")
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            continue


if __name__ == "__main__":
    main()
