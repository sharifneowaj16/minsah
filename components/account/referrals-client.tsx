'use client';
import { useState } from 'react';
import { Copy, CheckCircle as CheckCircleSolid, Users, DollarSign, Clock, Mail, MessageSquare, X, Sparkles } from 'lucide-react';

interface ReferralsClientProps {
  referralData: any;
  referrals: any[];
  shareOptions: any[];
  emailTemplates: any[];
}

export function ReferralsClient({ referralData, referrals, shareOptions, emailTemplates }: ReferralsClientProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(emailTemplates[0]);
  const [customMessage, setCustomMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (action: string) => {
    if (action === 'copy') handleCopyLink();
    else if (action === 'email') setShowEmailModal(true);
  };

  const formatPoints = (points: number) => points.toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h1>
          <p className="text-gray-600">Share the love and earn rewards</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <CheckCircleSolid className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold">{referralData.successfulReferrals}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold">{formatPoints(referralData.totalEarned)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{referralData.pendingReferrals}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Share Your Referral Code</h2>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your referral code</p>
            <p className="text-3xl font-bold text-purple-600 mb-4">{referralData.referralCode}</p>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700"
            >
              {copied ? <><CheckCircleSolid className="w-5 h-5" /><span>Copied!</span></> : <><Copy className="w-5 h-5" /><span>Copy Link</span></>}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleShare(option.action)}
                className="flex flex-col items-center p-4 border rounded-lg hover:border-purple-300"
              >
                <option.icon className="w-6 h-6 mb-2" />
                <span className="text-sm">{option.name}</span>
              </button>
            ))}
          </div>
        </div>

        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Send Referral Email</h3>
                <button onClick={() => setShowEmailModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-4 py-2 border rounded-lg mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
