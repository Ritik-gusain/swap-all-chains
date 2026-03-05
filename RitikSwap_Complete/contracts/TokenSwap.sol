// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  IERC20
 * @notice Minimal ERC-20 interface — only the functions TokenSwap needs.
 *         Using an interface instead of importing the full OpenZeppelin
 *         contract keeps the bytecode lean and teaches the pattern.
 */
interface IERC20 {
    function totalSupply()                                          external view returns (uint256);
    function balanceOf(address account)                             external view returns (uint256);
    function transfer(address to, uint256 amount)                   external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount)               external returns (bool);
    function allowance(address owner, address spender)              external view returns (uint256);
}

/**
 * @title  TokenSwap
 * @author Ritik Gusain  (github.com/Ritik-gusain)
 * @notice A simple ETH <-> ERC-20 token exchange contract.
 *
 *         How it works
 *         ─────────────
 *         1. The owner deploys this contract and supplies it with tokens.
 *         2. A fixed exchange rate (tokens per 1 ETH) is set at deploy time
 *            and can be updated by the owner later.
 *         3. Any user can:
 *              • Send ETH  → receive tokens  (buyTokens)
 *              • Send tokens → receive ETH   (sellTokens)
 *         4. The owner can deposit / withdraw ETH and tokens to manage liquidity.
 *
 *         Security patterns used
 *         ───────────────────────
 *         • Checks-Effects-Interactions (CEI) on every state-changing function.
 *         • Manual reentrancy guard (no external library dependency needed).
 *         • Custom errors instead of revert strings  → saves gas.
 *         • explicit uint256 arithmetic with no unchecked blocks.
 */
contract TokenSwap {

    // ─── State Variables ───────────────────────────────────────────────

    /// @notice The ERC-20 token this contract trades against ETH.
    IERC20 public immutable token;

    /// @notice The wallet that owns / manages this contract.
    address public owner;

    /**
     * @notice How many tokens a user receives per 1 ETH sent.
     * @dev    Example: rate = 1000  means  1 ETH = 1000 tokens.
     */
    uint256 public rate;

    /// @dev Reentrancy lock — 1 = unlocked, 2 = locked.
    uint256 private _lockStatus;

    // ─── Events ────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a user swaps ETH for tokens.
     * @param  buyer       The address that sent ETH.
     * @param  ethAmount   How much ETH was sent (in wei).
     * @param  tokenAmount How many tokens were received.
     */
    event TokensBought(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);

    /**
     * @notice Emitted when a user swaps tokens for ETH.
     * @param  seller      The address that sent tokens.
     * @param  tokenAmount How many tokens were sent.
     * @param  ethAmount   How much ETH was returned (in wei).
     */
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount);

    /// @notice Emitted when the owner updates the exchange rate.
    event RateUpdated(uint256 oldRate, uint256 newRate);

    /// @notice Emitted when the owner deposits ETH into the contract.
    event EthDeposited(uint256 amount);

    /// @notice Emitted when the owner withdraws ETH from the contract.
    event EthWithdrawn(uint256 amount);

    /// @notice Emitted when the owner withdraws tokens from the contract.
    event TokensWithdrawn(uint256 amount);

    // ─── Custom Errors ─────────────────────────────────────────────────
    // Custom errors cost less gas than require() with a string message.

    error NotOwner();
    error ZeroAddress();
    error ZeroRate();
    error ZeroAmount();
    error InsufficientTokenLiquidity(uint256 requested, uint256 available);
    error InsufficientEthLiquidity(uint256 requested, uint256 available);
    error TokenTransferFailed();
    error EthTransferFailed();
    error ReentrantCall();

    // ─── Modifiers ─────────────────────────────────────────────────────

    /// @dev Restricts a function to the contract owner.
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /**
     * @dev Prevents reentrancy attacks.
     *      Sets _lockStatus to 2 (locked) before the function body runs,
     *      then resets to 1 (unlocked) afterwards.
     *      Any re-entrant call will hit the check and revert.
     */
    modifier nonReentrant() {
        if (_lockStatus == 2) revert ReentrantCall();
        _lockStatus = 2;
        _;
        _lockStatus = 1;
    }

    // ─── Constructor ───────────────────────────────────────────────────

    /**
     * @param  tokenAddress The deployed ERC-20 token contract address.
     * @param  initialRate  Tokens per 1 ETH (e.g. 1000 = 1 ETH buys 1000 tokens).
     */
    constructor(address tokenAddress, uint256 initialRate) {
        if (tokenAddress == address(0)) revert ZeroAddress();
        if (initialRate == 0)          revert ZeroRate();

        token       = IERC20(tokenAddress);
        owner       = msg.sender;
        rate        = initialRate;
        _lockStatus = 1; // start unlocked
    }

    // ─── Core Swap Functions ───────────────────────────────────────────

    /**
     * @notice Buy tokens by sending ETH.
     *
     *         Example: if rate = 1000 and you send 0.5 ETH,
     *         you receive 500 tokens.
     *
     * @dev    Follows CEI:
     *           Check  — msg.value > 0
     *           Effect — (no local state change needed here; token balances live
     *                     in the token contract)
     *           Interact — transfer tokens to caller
     */
    function buyTokens() external payable nonReentrant {
        // ── Check ──
        if (msg.value == 0) revert ZeroAmount();

        uint256 tokenAmount = msg.value * rate / 1 ether;
        // Note: dividing by 1 ether (= 1e18) normalises from wei to ETH units
        // so the rate stays human-readable (tokens per whole ETH, not per wei).

        uint256 contractTokenBalance = token.balanceOf(address(this));
        if (tokenAmount > contractTokenBalance)
            revert InsufficientTokenLiquidity(tokenAmount, contractTokenBalance);

        // ── Interact ──
        bool success = token.transfer(msg.sender, tokenAmount);
        if (!success) revert TokenTransferFailed();

        emit TokensBought(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @notice Sell tokens to receive ETH.
     *
     *         Example: if rate = 1000 and you sell 500 tokens,
     *         you receive 0.5 ETH.
     *
     * @param  tokenAmount Number of tokens to sell (in token's smallest unit,
     *                     usually 18 decimals for standard ERC-20).
     *
     * @dev    Caller must first approve this contract to spend their tokens:
     *           token.approve(address(tokenSwap), tokenAmount)
     *         This is standard ERC-20 pattern.
     */
    function sellTokens(uint256 tokenAmount) external nonReentrant {
        // ── Check ──
        if (tokenAmount == 0) revert ZeroAmount();

        uint256 ethAmount = tokenAmount * 1 ether / rate;
        // Inverse of buyTokens: tokens / rate = ETH owed (in wei)

        uint256 contractEthBalance = address(this).balance;
        if (ethAmount > contractEthBalance)
            revert InsufficientEthLiquidity(ethAmount, contractEthBalance);

        // ── Interact (tokens first, then ETH) ──
        // Pull tokens from the seller. Requires prior approval.
        bool tokenSuccess = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!tokenSuccess) revert TokenTransferFailed();

        // Send ETH to the seller using .call() — the recommended pattern.
        // Never use .transfer() or .send() in modern Solidity.
        (bool ethSuccess, ) = payable(msg.sender).call{value: ethAmount}("");
        if (!ethSuccess) revert EthTransferFailed();

        emit TokensSold(msg.sender, tokenAmount, ethAmount);
    }

    // ─── Owner: Liquidity Management ───────────────────────────────────

    /**
     * @notice Owner deposits ETH to fund sell-side liquidity.
     *         Call this function and send ETH with the transaction.
     */
    function depositEth() external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();
        emit EthDeposited(msg.value);
    }

    /**
     * @notice Owner withdraws ETH from the contract.
     * @param  amount Amount of ETH (in wei) to withdraw.
     */
    function withdrawEth(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0)                      revert ZeroAmount();
        if (amount > address(this).balance)   revert InsufficientEthLiquidity(amount, address(this).balance);

        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert EthTransferFailed();

        emit EthWithdrawn(amount);
    }

    /**
     * @notice Owner withdraws tokens from the contract.
     * @param  amount Number of tokens to withdraw.
     */
    function withdrawTokens(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 contractBal = token.balanceOf(address(this));
        if (amount > contractBal) revert InsufficientTokenLiquidity(amount, contractBal);

        bool success = token.transfer(owner, amount);
        if (!success) revert TokenTransferFailed();

        emit TokensWithdrawn(amount);
    }

    // ─── Owner: Admin ───────────────────────────────────────────────────

    /**
     * @notice Update the exchange rate.
     * @param  newRate New number of tokens per 1 ETH.
     */
    function setRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert ZeroRate();
        emit RateUpdated(rate, newRate);
        rate = newRate;
    }

    /**
     * @notice Transfer ownership to a new address.
     * @param  newOwner The address that will become the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    // ─── View Helpers ───────────────────────────────────────────────────

    /**
     * @notice Returns the token balance held by this contract.
     *         This is the available buy-side liquidity.
     */
    function tokenLiquidity() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Returns the ETH balance held by this contract.
     *         This is the available sell-side liquidity.
     */
    function ethLiquidity() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Preview how many tokens you would receive for a given ETH amount.
     * @param  ethAmount Amount of ETH in wei.
     */
    function previewBuy(uint256 ethAmount) external view returns (uint256 tokenAmount) {
        tokenAmount = ethAmount * rate / 1 ether;
    }

    /**
     * @notice Preview how much ETH you would receive for selling a given token amount.
     * @param  tokenAmount Number of tokens (in smallest unit).
     */
    function previewSell(uint256 tokenAmount) external view returns (uint256 ethAmount) {
        ethAmount = tokenAmount * 1 ether / rate;
    }

    // ─── Fallback ───────────────────────────────────────────────────────

    /**
     * @dev Allows the contract to receive plain ETH transfers (e.g. from depositEth).
     *      Without this, any ETH sent directly would revert.
     */
    receive() external payable {}
}
