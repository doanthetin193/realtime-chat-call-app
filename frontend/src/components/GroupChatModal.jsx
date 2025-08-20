import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GroupChatModal = ({ isOpen, onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const { token } = useAuth();

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const results = await api.searchUsers(token, query);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        // Debounce search
        setTimeout(() => {
            if (query === searchQuery) {
                searchUsers(query);
            }
        }, 300);
    };

    const toggleUserSelection = (user) => {
        setSelectedUsers(prev => {
            const isSelected = prev.find(u => u._id === user._id);
            if (isSelected) {
                return prev.filter(u => u._id !== user._id);
            } else {
                return [...prev, user];
            }
        });
    };

    const createGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            alert('Please enter group name and select at least one user');
            return;
        }

        setCreating(true);
        try {
            const groupData = {
                name: groupName.trim(),
                memberIds: selectedUsers.map(u => u._id),
                isGroup: true
            };

            const newGroup = await api.createConversation(token, groupData);
            onGroupCreated(newGroup);
            handleClose();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setGroupName('');
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-hidden">
                <h2 className="text-xl font-semibold mb-4">Create Group Chat</h2>
                
                {/* Group Name */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Group Name</label>
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Enter group name"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* User Search */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Add Members</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search users by username or email"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Selected Members</label>
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                                <span
                                    key={user._id}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                    {user.username}
                                    <button
                                        onClick={() => toggleUserSelection(user)}
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                <div className="mb-4 max-h-32 overflow-y-auto">
                    {searching && (
                        <div className="text-center text-gray-500 py-2">Searching...</div>
                    )}
                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            {searchResults.map(user => {
                                const isSelected = selectedUsers.find(u => u._id === user._id);
                                return (
                                    <div
                                        key={user._id}
                                        onClick={() => toggleUserSelection(user)}
                                        className={`p-2 rounded cursor-pointer flex items-center gap-3 ${
                                            isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="text-2xl">👤</div>
                                        <div className="flex-1">
                                            <div className="font-medium">{user.username}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                        {isSelected && (
                                            <div className="text-blue-600">✓</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                        disabled={creating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={createGroup}
                        disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
                        className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                    >
                        {creating ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Group Settings Modal
export const GroupSettingsModal = ({ isOpen, onClose, conversation, onConversationUpdated }) => {
    const [groupName, setGroupName] = useState(conversation?.name || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [updating, setUpdating] = useState(false);
    const { token, user } = useAuth();

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const results = await api.searchUsers(token, query);
            // Filter out users already in the group
            const filtered = results.filter(user => 
                !conversation.members.find(member => member._id === user._id)
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
        }
    };

    const addMember = async (userId) => {
        try {
            await api.addGroupMember(token, conversation._id, userId);
            // Refresh conversation data
            if (onConversationUpdated) {
                onConversationUpdated();
            }
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member');
        }
    };

    const removeMember = async (userId) => {
        if (window.confirm('Are you sure you want to remove this member?')) {
            try {
                await api.removeGroupMember(token, conversation._id, userId);
                if (onConversationUpdated) {
                    onConversationUpdated();
                }
            } catch (error) {
                console.error('Error removing member:', error);
                alert('Failed to remove member');
            }
        }
    };

    const updateGroupName = async () => {
        if (!groupName.trim()) {
            alert('Please enter a group name');
            return;
        }

        setUpdating(true);
        try {
            await api.updateConversation(token, conversation._id, { name: groupName.trim() });
            if (onConversationUpdated) {
                onConversationUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Error updating group name:', error);
            alert('Failed to update group name');
        } finally {
            setUpdating(false);
        }
    };

    if (!isOpen || !conversation) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-hidden">
                <h2 className="text-xl font-semibold mb-4">Group Settings</h2>
                
                {/* Group Name */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Group Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={updateGroupName}
                            disabled={updating || groupName === conversation.name}
                            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                            {updating ? '...' : 'Update'}
                        </button>
                    </div>
                </div>

                {/* Current Members */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Members ({conversation.members?.length})
                    </label>
                    <div className="max-h-24 overflow-y-auto space-y-2">
                        {conversation.members?.map(member => (
                            <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">👤</span>
                                    <span className="text-sm">{member.username}</span>
                                    {member._id === user.id && (
                                        <span className="text-xs text-gray-500">(You)</span>
                                    )}
                                </div>
                                {member._id !== user.id && (
                                    <button
                                        onClick={() => removeMember(member._id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Members */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Add Members</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchUsers(e.target.value);
                        }}
                        placeholder="Search users to add"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {searching && (
                        <div className="text-center text-gray-500 py-2">Searching...</div>
                    )}
                    
                    {searchResults.length > 0 && (
                        <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                            {searchResults.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => addMember(user._id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">👤</span>
                                        <span className="text-sm">{user.username}</span>
                                    </div>
                                    <button className="text-blue-500 text-sm">Add</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupChatModal;
