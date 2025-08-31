'use client';

import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Badge } from '../../ui/Badge';

const client = generateClient<Schema>();

interface TeamSetupStepProps {
  userId: string;
}

const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    maxMembers: 3,
    maxRepositories: 5,
    features: [
      'Real-time Activity Feed',
      'Basic Analytics Dashboard',
      'GitHub Integration',
      'Team Collaboration',
      'Activity Notifications',
      'Developer Productivity Metrics'
    ],
    price: '$0',
    priceSubtext: 'Forever free',
    popular: false,
  },
  pro: {
    name: 'Pro',
    maxMembers: 10,
    maxRepositories: 50,
    features: [
      'Everything in Free',
      'Advanced Analytics',
      'Custom Reports',
      'API Access',
      'Priority Support',
      'Export Data',
      'Custom Integrations'
    ],
    price: '$29',
    priceSubtext: 'per month',
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    maxMembers: -1, // unlimited
    maxRepositories: -1, // unlimited
    features: [
      'Everything in Pro',
      'Unlimited Members',
      'Unlimited Repositories',
      'SSO/SAML',
      'Dedicated Support',
      'Custom SLA',
      'On-premise Option'
    ],
    price: 'Custom',
    priceSubtext: 'Contact sales',
    popular: false,
  },
};

export default function TeamSetupStep({ userId }: TeamSetupStepProps) {
  const [teamName, setTeamName] = useState('');
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [creating, setCreating] = useState(false);
  const [teamCreated, setTeamCreated] = useState(false);

  const handleAddInvite = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const handleRemoveInvite = (index: number) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
  };

  const handleInviteChange = (index: number, value: string) => {
    const newInvites = [...inviteEmails];
    newInvites[index] = value;
    setInviteEmails(newInvites);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    setCreating(true);
    try {
      // Create team
      const teamSlug = teamName.toLowerCase().replace(/\s+/g, '-');
      const { data: team } = await client.models.Team.create({
        name: teamName,
        slug: teamSlug,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (team) {
        // Create subscription
        const tier = SUBSCRIPTION_TIERS[selectedTier];
        await client.models.TeamSubscription.create({
          teamId: team.id,
          tier: selectedTier,
          status: 'active',
          maxMembers: tier.maxMembers,
          maxRepositories: tier.maxRepositories,
          features: tier.features,
          billingCycle: selectedTier === 'free' ? null : 'monthly',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: selectedTier === 'free' 
            ? null 
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create team member entry for owner
        await client.models.TeamMember.create({
          teamId: team.id,
          userId: userId,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        });

        // Send invitations
        const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'));
        for (const email of validEmails) {
          const inviteToken = Math.random().toString(36).substring(2, 15);
          await client.models.TeamInvitation.create({
            teamId: team.id,
            email: email.trim(),
            invitedBy: userId,
            token: inviteToken,
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            createdAt: new Date().toISOString(),
          });
        }

        setTeamCreated(true);
      }
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreating(false);
    }
  };

  if (teamCreated) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Team Created Successfully!
        </h2>
        
        <p className="text-gray-600 mb-2">
          Your team "{teamName}" has been created with the {SUBSCRIPTION_TIERS[selectedTier].name} plan.
        </p>
        
        {inviteEmails.filter(e => e.trim()).length > 0 && (
          <p className="text-sm text-gray-500">
            Invitations have been sent to your team members.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
        Set Up Your Team
      </h2>
      
      <p className="text-gray-600 mb-2 text-center">
        Create a team to collaborate with your colleagues and track development activity across your organization.
      </p>
      <p className="text-sm text-green-600 mb-8 text-center font-medium">
        Start with our generous free tier - no credit card required!
      </p>

      {/* Team Name */}
      <div className="mb-8">
        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
          Team Name
        </label>
        <input
          type="text"
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Acme Engineering"
        />
      </div>

      {/* Subscription Tiers */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
            <Card
              key={key}
              className={`relative p-6 cursor-pointer transition-all ${
                selectedTier === key
                  ? 'ring-2 ring-blue-600 bg-blue-50 transform scale-105'
                  : 'hover:shadow-lg hover:transform hover:scale-102'
              }`}
              onClick={() => setSelectedTier(key as 'free' | 'pro' | 'enterprise')}
            >
              {tier.popular && (
                <div className="absolute -top-3 -right-2">
                  <Badge variant="primary" className="shadow-lg">Most Popular</Badge>
                </div>
              )}
              {key === 'free' && (
                <div className="absolute -top-3 -left-2">
                  <Badge variant="success" className="shadow-lg">Recommended</Badge>
                </div>
              )}
              
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{tier.name}</h4>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-sm text-gray-600 ml-1">{tier.priceSubtext}</span>
              </div>
              
              <ul className="space-y-2 mb-4 pb-4 border-b">
                <li className="text-sm text-gray-700 font-medium">
                  {tier.maxMembers === -1 ? 'Unlimited' : tier.maxMembers} team members
                </li>
                <li className="text-sm text-gray-700 font-medium">
                  {tier.maxRepositories === -1 ? 'Unlimited' : tier.maxRepositories} repositories
                </li>
              </ul>
              
              <div>
                <p className="text-xs font-medium text-gray-700 mb-3">Everything you get:</p>
                <ul className="space-y-2">
                  {tier.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start">
                      <svg className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  {tier.features.length > 4 && (
                    <li className="text-xs text-gray-500 italic">
                      +{tier.features.length - 4} more features
                    </li>
                  )}
                </ul>
              </div>
              
              {selectedTier === key && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
        
        {selectedTier === 'free' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Great choice!</strong> The free tier is perfect for small teams getting started. You can always upgrade later as your team grows.
            </p>
          </div>
        )}
      </div>

      {/* Team Invitations */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Members (Optional)</h3>
        <div className="space-y-3">
          {inviteEmails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => handleInviteChange(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="colleague@company.com"
              />
              <Button
                variant="outline"
                onClick={() => handleRemoveInvite(index)}
                disabled={inviteEmails.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        
        <Button
          variant="outline"
          onClick={handleAddInvite}
          className="mt-3"
          disabled={inviteEmails.length >= SUBSCRIPTION_TIERS[selectedTier].maxMembers}
        >
          Add Another Member
        </Button>
        
        {selectedTier === 'free' && inviteEmails.filter(e => e.trim()).length >= 2 && (
          <p className="text-sm text-amber-600 mt-2">
            You can invite up to {2 - inviteEmails.filter(e => e.trim()).length} more team member{2 - inviteEmails.filter(e => e.trim()).length === 1 ? '' : 's'} on the free plan.
          </p>
        )}
      </div>

      <div className="text-center">
        <Button
          onClick={handleCreateTeam}
          disabled={!teamName.trim() || creating}
          size="lg"
        >
          {creating ? 'Creating Team...' : 'Create Team'}
        </Button>
      </div>
    </div>
  );
}