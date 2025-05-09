"use client";

import { ethers } from 'ethers';

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Governor ABI - only including the propose function for simplicity
const governorABI = [
  "function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) public returns (uint256)",
  "function state(uint256 proposalId) public view returns (uint8)",
  "function castVote(uint256 proposalId, uint8 support) public returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) public returns (uint256)"
];

// Contract addresses from our deployment
const GOVERNOR_CONTRACT_ADDRESS = "0xceb8CB84415bb7712f1B34f628f00d805cd6740B";
const GOVERNANCE_TOKEN_ADDRESS = "0xc95B4096Be9C48A1C63c9CCa171CfC16069779D0";
const TIMELOCK_CONTRACT_ADDRESS = "0xF269cFe75b406B074a93cDEa74B7338D6257F9C9";

// Network config
const NETWORK = {
  chainId: 11155111, // Sepolia
  name: "Sepolia Testnet"
};

/**
 * Connect to wallet using ethers.js
 */
export async function connectWallet() {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create ethers provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check if we're on the correct network
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(NETWORK.chainId)) {
        // Try to switch to the correct network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${NETWORK.chainId.toString(16)}` }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            throw new Error(`Please add the ${NETWORK.name} network to your wallet`);
          }
          throw switchError;
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      return {
        success: true,
        address,
        signer
      };
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      };
    }
  } else {
    return {
      success: false,
      error: 'MetaMask not installed'
    };
  }
}

/**
 * Submit a proposal to the Governor contract
 */
export async function submitGovernanceProposal(
  signer: ethers.Signer,
  proposalData: {
    title: string;
    description: string;
    votingPeriod: number;
    proposalType: string;
    targets?: string[];
    values?: string[];
    calldatas?: string[];
  }
) {
  try {
    // Create contract instance
    const governorContract = new ethers.Contract(
      GOVERNOR_CONTRACT_ADDRESS,
      governorABI,
      signer
    );

    // Format the proposal description
    // Often includes the title and details in a structured format
    const description = `# ${proposalData.title}\n\n${proposalData.description}\n\nType: ${proposalData.proposalType}\nVoting Period: ${proposalData.votingPeriod} days`;

    // Default values if not provided - use the timelock as the target
    const targets = proposalData.targets || [TIMELOCK_CONTRACT_ADDRESS];
    const values = proposalData.values || ['0']; // 0 ETH

    // For a simple proposal with no actions, we can use an empty bytes
    // In a real scenario, this would contain the encoded function call
    const calldatas = proposalData.calldatas || ['0x'];

    // Convert values to BigInt format
    const valueBigInts = values.map(value => ethers.parseEther(value));

    console.log("Submitting proposal with parameters:", {
      targets,
      values: valueBigInts,
      calldatas,
      description
    });

    // Submit the proposal transaction
    const tx = await governorContract.propose(
      targets,
      valueBigInts,
      calldatas,
      description
    );

    console.log("Proposal transaction sent:", tx.hash);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Proposal transaction confirmed:", receipt);

    // Get the proposal ID from the event logs
    // This would require parsing the event logs in a real implementation
    // For now we'll just return the transaction hash as a placeholder
    return {
      success: true,
      proposalId: receipt.hash,
      transactionHash: receipt.hash
    };
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit proposal'
    };
  }
}

/**
 * Get the governance token balance for an address
 */
export async function getVotingPower(address: string) {
  if (typeof window === 'undefined' || !window.ethereum) return { success: false, error: 'MetaMask not installed' };

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Simple ERC20 ABI for balanceOf
    const tokenABI = ["function balanceOf(address) view returns (uint256)"];
    const tokenContract = new ethers.Contract(GOVERNANCE_TOKEN_ADDRESS, tokenABI, provider);

    const balance = await tokenContract.balanceOf(address);
    return {
      success: true,
      balance: ethers.formatEther(balance)
    };
  } catch (error) {
    console.error('Error getting voting power:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get voting power'
    };
  }
}