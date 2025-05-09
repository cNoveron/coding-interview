interface ProposalData {
  title: string;
  description: string;
  votingPeriod: number;
  proposalType: 'general' | 'treasury' | 'parameter';
}

interface SubmissionResult {
  success: boolean;
  message: string;
  proposalId?: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposalType: 'general' | 'treasury' | 'parameter';
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  endTime: number;
}

/**
 * Submit a governance proposal to the DAO
 * In a real application, this would interact with a blockchain
 */
export async function submitProposal(data: ProposalData): Promise<SubmissionResult> {
  try {
    // Simulate API call or blockchain transaction
    // This is where you would integrate with a web3 library like ethers.js
    console.log('Submitting proposal:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock successful response
    const mockProposalId = 'prop_' + Math.random().toString(36).substring(2, 10);

    return {
      success: true,
      message: 'Proposal submitted successfully',
      proposalId: mockProposalId
    };
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit proposal'
    };
  }
}

/**
 * Fetch active proposals from the DAO
 * In a real application, this would query blockchain data
 */
export async function getActiveProposals(): Promise<Proposal[]> {
  // Mock implementation
  return [
    {
      id: 'prop_xyz123',
      title: 'Increase Treasury Allocation',
      description: 'Proposal to increase the treasury allocation by 5%',
      proposalType: 'treasury' as const,
      status: 'active' as const,
      votesFor: 120000,
      votesAgainst: 45000,
      endTime: Date.now() + 1000 * 60 * 60 * 24 * 3 // 3 days from now
    }
  ];
}