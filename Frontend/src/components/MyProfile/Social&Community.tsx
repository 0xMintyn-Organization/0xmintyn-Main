import { SocialAccount } from "@/lib/types";
import { mockContributions, mockSocialAccounts } from "@/lib/utils";
import { ChangeEvent, FormEvent, useState } from "react";
import SocialIcon from "./SocialIcon";
import ConnectAccount from "./ConnectAccount";
import { VscVerifiedFilled } from "react-icons/vsc";
import { Plus } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";


function SocialCommunity() {
    const [activeTab, setActiveTab] = useState<'connections' | 'contributions'>('connections');
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [accountToAdd, setAccountToAdd] = useState<SocialAccount['platform']>('Twitter');
  
    const handleAddAccount = () => {
      setIsAddingAccount(true);
    };
  
    const handleSubmitAccount = (e: FormEvent) => {
      e.preventDefault();
      // In a real implementation, this would connect to the platform's OAuth or similar
      setIsAddingAccount(false);
    };
  
    const handleCancelAddAccount = () => {
      setIsAddingAccount(false);
    };

    const handleAccountChange = (e: ChangeEvent<HTMLSelectElement>) => {
      setAccountToAdd(e.target.value as SocialAccount['platform']); // Assuming you're using useState
    };
  
    const getPlatformColor = (platform: string): string => {
      switch (platform.toLowerCase()) {
        case 'twitter':
          return 'bg-blue-100 text-blue-800';
        case 'discord':
          return 'bg-indigo-100 text-indigo-800';
        case 'telegram':
          return 'bg-blue-100 text-blue-800';
        case 'lens':
          return 'bg-green-100 text-green-800';
        case 'farcaster':
          return 'bg-purple-100 text-purple-800';
        case 'internal':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };
  
    const getContributionTypeIcon = (type: string) => {
      switch (type.toLowerCase()) {
        case 'post':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          );
          case 'comment':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            );
          case 'share':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            );
          case 'like':
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            );
          default:
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
        }
      };
    
      // Calculate engagement score based on contributions
      const calculateEngagementScore = (): number => {
        let score = 0;
        mockContributions.forEach(contribution => {
          // Points for each type of contribution
          if (contribution.type === 'Post') score += 5;
          if (contribution.type === 'Comment') score += 3;
          if (contribution.type === 'Share') score += 4;
          if (contribution.type === 'Like') score += 1;
          
          // Points for engagement on their contributions
          score += Math.floor(contribution.likes / 5);
          score += contribution.comments;
          score += contribution.shares * 2;
        });
        return score;
      };
    
      const engagementScore = calculateEngagementScore();
    
     
    
      return (
          <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-lg overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-4 px-6 text-center ${
                  activeTab === 'connections'
                    ? 'border-b-2 border-green-500 text-green-500 font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('connections')}
              >
                Connected Accounts
              </button>
           
            </div>
            
            {/* Connected Accounts Tab Content */}
            {activeTab === 'connections' && (
              <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Linked Social Accounts</h3>
                  <button
                    onClick={handleAddAccount}
                    className="bg-green-900 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
                  >
                    <Plus size={14} className="mr-1" />
                    Link Account
                  </button>
                </div>
                
                {isAddingAccount && (
                  <ConnectAccount submitAccount={handleSubmitAccount} accountToAdd={accountToAdd} accToAddFunc={handleAccountChange} cancelAddAccount={handleCancelAddAccount}/>
                )}
                
                <div className="space-y-4">
                  {mockSocialAccounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-green-900">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-gray-100">
                          <SocialIcon platform={account.platform} />
                        </div>
                        <div className="ml-3">
                          <h4 className="font-medium">{account.platform}</h4>
                          <div className="flex items-center space-x-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{account.username}</p>
                            {account.isVerified && (
                              <VscVerifiedFilled className="text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 dark:hover:text-green-400 text-sm"
                      >
                        View Profile
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
         
          </div>
      )
}

export default SocialCommunity