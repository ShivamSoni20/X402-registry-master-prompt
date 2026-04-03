// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * x402 Universal Service Registry — Staking Contract
 * Deployed on Base Sepolia
 *
 * Flow:
 * 1. Provider calls stakeAndRegister() with ETH (representing USDC for demo)
 * 2. Service is recorded on-chain with provider address + stake
 * 3. Anyone can call challengeService() if SLA is breached
 * 4. Valid challenge: 10% slashed from stake, 5% to challenger, 5% burned
 * 5. Provider can unstake after 7-day lockup if no active challenges
 */
contract RegistryStaking {

    struct ServiceStake {
        address provider;
        uint256 stakedAmount;
        uint256 stakedAt;
        uint256 slaUptimeTarget;   // basis points: 9900 = 99.00%
        bool active;
        uint256 slashCount;
    }

    mapping(bytes32 => ServiceStake) public stakes;
    mapping(address => bytes32[]) public providerServices;

    uint256 public constant SLASH_PERCENT = 10;
    uint256 public constant CHALLENGER_REWARD = 50;
    uint256 public constant MIN_STAKE = 0.0001 ether;
    uint256 public constant LOCKUP_PERIOD = 7 days;

    event ServiceStaked(bytes32 indexed serviceId, address indexed provider, uint256 amount);
    event ServiceSlashed(bytes32 indexed serviceId, address indexed challenger, uint256 slashedAmount, uint256 reward);
    event ServiceUnstaked(bytes32 indexed serviceId, address indexed provider, uint256 returned);

    error InsufficientStake();
    error ServiceNotFound();
    error ServiceNotActive();
    error StillInLockup();
    error NotProvider();
    error SLANotBreached();

    function stakeAndRegister(bytes32 serviceId, uint256 slaTarget) external payable {
        if (msg.value < MIN_STAKE) revert InsufficientStake();

        stakes[serviceId] = ServiceStake({
            provider: msg.sender,
            stakedAmount: msg.value,
            stakedAt: block.timestamp,
            slaUptimeTarget: slaTarget,
            active: true,
            slashCount: 0
        });

        providerServices[msg.sender].push(serviceId);
        emit ServiceStaked(serviceId, msg.sender, msg.value);
    }

    function challengeService(bytes32 serviceId, uint256 reportedUptime) external {
        ServiceStake storage stake = stakes[serviceId];

        if (stake.provider == address(0)) revert ServiceNotFound();
        if (!stake.active) revert ServiceNotActive();
        if (reportedUptime >= stake.slaUptimeTarget) revert SLANotBreached();

        uint256 slashAmount = (stake.stakedAmount * SLASH_PERCENT) / 100;
        uint256 challengerReward = (slashAmount * CHALLENGER_REWARD) / 100;
        uint256 burned = slashAmount - challengerReward;

        stake.stakedAmount -= slashAmount;
        stake.slashCount += 1;

        (bool sent,) = msg.sender.call{value: challengerReward}("");
        require(sent, "Reward transfer failed");

        (bool burned_,) = address(0x000000000000000000000000000000000000dEaD).call{value: burned}("");
        require(burned_, "Burn failed");

        emit ServiceSlashed(serviceId, msg.sender, slashAmount, challengerReward);
    }

    function unstake(bytes32 serviceId) external {
        ServiceStake storage stake = stakes[serviceId];

        if (stake.provider != msg.sender) revert NotProvider();
        if (!stake.active) revert ServiceNotActive();
        if (block.timestamp < stake.stakedAt + LOCKUP_PERIOD) revert StillInLockup();

        uint256 amount = stake.stakedAmount;
        stake.active = false;
        stake.stakedAmount = 0;

        (bool sent,) = msg.sender.call{value: amount}("");
        require(sent, "Unstake transfer failed");

        emit ServiceUnstaked(serviceId, msg.sender, amount);
    }

    function getStake(bytes32 serviceId) external view returns (ServiceStake memory) {
        return stakes[serviceId];
    }

    function getProviderServices(address provider) external view returns (bytes32[] memory) {
        return providerServices[provider];
    }

    receive() external payable {}
}
