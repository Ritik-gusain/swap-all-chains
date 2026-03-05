// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  RitikToken (RTK)
 * @author Ritik Gusain
 * @notice A minimal ERC-20 token used to test the TokenSwap contract.
 *
 *         This is a "from scratch" ERC-20 — no OpenZeppelin dependency —
 *         which means you can see exactly how the standard works.
 *
 *         ERC-20 Standard: https://eips.ethereum.org/EIPS/eip-20
 */
contract RitikToken {

    // ─── ERC-20 State ──────────────────────────────────────────────────

    string  public name     = "Ritik Token";
    string  public symbol   = "RTK";
    uint8   public decimals = 18;           // standard: 1 token = 1e18 smallest units

    uint256 public totalSupply;

    /// @dev address → how many tokens they hold
    mapping(address => uint256) public balanceOf;

    /// @dev owner → spender → how many tokens spender is allowed to move
    mapping(address => mapping(address => uint256)) public allowance;

    // ─── Events (required by ERC-20 spec) ─────────────────────────────

    event Transfer(address indexed from, address indexed to,      uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // ─── Constructor ───────────────────────────────────────────────────

    /**
     * @param initialSupply Total tokens to mint at deploy, expressed in
     *                      whole tokens (e.g. 1_000_000 = one million RTK).
     *                      Internally stored with 18 decimal places.
     */
    constructor(uint256 initialSupply) {
        // Multiply by 10^18 to convert whole-token amount to smallest unit
        uint256 amount = initialSupply * 10 ** decimals;
        totalSupply          = amount;
        balanceOf[msg.sender] = amount;         // mint all tokens to deployer
        emit Transfer(address(0), msg.sender, amount);
    }

    // ─── ERC-20 Core Functions ─────────────────────────────────────────

    /**
     * @notice Transfer tokens directly to `to`.
     * @param  to     Recipient address.
     * @param  amount Amount in smallest units (wei-equivalent for tokens).
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @notice Approve `spender` to move up to `amount` of your tokens.
     *         Required before TokenSwap.sellTokens() can pull your tokens.
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Move tokens on behalf of `from` (requires prior approval).
     *         This is what TokenSwap calls during sellTokens().
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "RTK: insufficient allowance");

        // Decrease allowance (prevents double-spend)
        allowance[from][msg.sender] = allowed - amount;

        _transfer(from, to, amount);
        return true;
    }

    // ─── Internal ─────────────────────────────────────────────────────

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "RTK: transfer from zero address");
        require(to   != address(0), "RTK: transfer to zero address");
        require(balanceOf[from] >= amount, "RTK: insufficient balance");

        balanceOf[from] -= amount;
        balanceOf[to]   += amount;
        emit Transfer(from, to, amount);
    }
}
