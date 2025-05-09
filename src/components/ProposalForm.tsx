"use client";

import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import { submitProposal } from '../utils/proposals';
import { connectWallet, submitGovernanceProposal, getVotingPower } from '../utils/web3';
import { ethers } from 'ethers';

interface ProposalFormProps {
  onSubmit?: (formData: ProposalData) => void;
}

interface ProposalData {
  title: string;
  description: string;
  votingPeriod: number;
  proposalType: 'general' | 'treasury' | 'parameter';
}

// Hardcoded list of proposals
const RECENT_PROPOSALS = [
  {
    id: 1,
    title: "Increase quorum by 3 votes",
    type: "parameter",
    status: "Active",
    txHash: "0xce7230110b64ac896e6d82ac81835a331941657caa581eba91ae8e7dbd7f85d6",
    date: "2023-07-15",
    proposer: "0x663d3FC1a358548c12f635de2aaca31FC637ABC6",
    description: "This proposal aims to increase the governance quorum requirement by 3 votes to ensure broader consensus on decisions."
  }
];

const ProposalForm: React.FC<ProposalFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<ProposalData>({
    title: '',
    description: '',
    votingPeriod: 7,
    proposalType: 'general',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [votingPower, setVotingPower] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'votingPeriod' ? parseInt(value) : value,
    }));
  };

  // Fetch voting power when wallet is connected
  useEffect(() => {
    if (walletConnected && walletAddress) {
      fetchVotingPower(walletAddress);
    }
  }, [walletConnected, walletAddress]);

  const fetchVotingPower = async (address: string) => {
    const result = await getVotingPower(address);
    if (result.success && result.balance) {
      setVotingPower(result.balance);
    }
  };

  const handleConnectWallet = async () => {
    setMessage({ text: 'Connecting to wallet...', type: 'info' });

    const result = await connectWallet();

    if (result.success && result.address) {
      setWalletConnected(true);
      setWalletAddress(result.address);
      setSigner(result.signer);
      setMessage({ text: `Connected: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`, type: 'success' });
    } else {
      setMessage({ text: result.error || 'Failed to connect wallet', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: 'Processing submission...', type: 'info' });

    try {
      // Call the external onSubmit if provided
      onSubmit?.(formData);

      if (walletConnected && signer) {
        // Submit to blockchain via Governor contract
        setMessage({ text: 'Submitting proposal to blockchain...', type: 'info' });

        const result = await submitGovernanceProposal(signer, formData);

        if (result.success) {
          setMessage({
            text: `Proposal submitted on-chain! Transaction: ${result.transactionHash.slice(0, 10)}...`,
            type: 'success'
          });

          // Reset the form
          setFormData({
            title: '',
            description: '',
            votingPeriod: 7,
            proposalType: 'general',
          });
        } else {
          setMessage({
            text: result.error || 'Failed to submit proposal to blockchain',
            type: 'error'
          });
        }
      } else {
        // Fall back to mock implementation if wallet not connected
        const result = await submitProposal(formData);

        if (result.success) {
          setMessage({
            text: `Proposal submitted (mock)! Proposal ID: ${result.proposalId}`,
            type: 'success'
          });

          // Reset the form
          setFormData({
            title: '',
            description: '',
            votingPeriod: 7,
            proposalType: 'general',
          });
        } else {
          setMessage({
            text: result.message || 'Failed to submit proposal',
            type: 'error'
          });
        }
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Submit Governance Proposal</h2>

        <div className="mb-6 flex justify-between items-center">
          {walletConnected ? (
            <div className="text-sm text-gray-600">
              <div>Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</div>
              {votingPower && <div className="mt-1 font-medium">Voting Power: {parseFloat(votingPower).toFixed(2)} GOV</div>}
            </div>
          ) : (
            <span className="text-sm text-gray-600">Wallet not connected</span>
          )}

          {!walletConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectWallet}
              disabled={isSubmitting}
              type="button"
            >
              Connect Wallet
            </Button>
          )}
        </div>

        <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-6 text-sm">
          <p className="font-medium">Network: Sepolia Testnet</p>
          <p className="mt-1">Governor: 0xceb8...740B</p>
          <p className="mt-1">Token: 0xc95B...9D0</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' :
              message.type === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposal Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter proposal title"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposal Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your proposal in detail..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposal Type
              </label>
              <select
                name="proposalType"
                value={formData.proposalType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                <option value="general">General</option>
                <option value="treasury">Treasury</option>
                <option value="parameter">Parameter Change</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voting Period (days)
              </label>
              <input
                type="number"
                name="votingPeriod"
                value={formData.votingPeriod}
                onChange={handleChange}
                min="1"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <Button
              variant="primary"
              size="lg"
              disabled={isSubmitting || (!walletConnected && votingPower === '0')}
              type="submit"
            >
              {isSubmitting ? 'Submitting...' : `Submit Proposal${walletConnected ? ' On-Chain' : ''}`}
            </Button>
          </div>

          {walletConnected && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Submitting a proposal requires governance tokens. Your proposal will be submitted to the Sepolia testnet.
            </p>
          )}
        </form>
      </Card>

      {/* Recent Proposals Section */}
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-bold mb-4">Recent Proposals</h2>

        {RECENT_PROPOSALS.map((proposal) => (
          <div key={proposal.id} className="border rounded-lg mb-4 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <div>
                <h3 className="font-medium">{proposal.title}</h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-500">Submitted: {proposal.date}</span>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {proposal.status}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">Type: {proposal.type}</span>
                </div>
              </div>
              {walletConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={!walletConnected}
                >
                  Vote
                </Button>
              )}
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>

              <div className="flex flex-col space-y-2 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Proposer:</span>{' '}
                  <a
                    href={`https://sepolia.etherscan.io/address/${proposal.proposer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                  </a>
                </div>
                <div>
                  <span className="font-medium">Transaction:</span>{' '}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${proposal.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {proposal.txHash.slice(0, 6)}...{proposal.txHash.slice(-4)}
                  </a>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Votes</span>
                  <span className="text-xs text-gray-600">45% For / 55% Against</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {RECENT_PROPOSALS.length === 0 && (
          <p className="text-center text-gray-500 py-4">No proposals found</p>
        )}
      </Card>
    </>
  );
};

export default ProposalForm;