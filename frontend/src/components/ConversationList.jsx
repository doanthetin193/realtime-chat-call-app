import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [allClassrooms, setAllClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const { token, user, socket, logout } = useAuth();

  const fetchMyClassrooms = useCallback(async () => {
    try {
      const data = await api.listClassrooms(token, true);
      setClassrooms(data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  }, [token]);

  const fetchAllClassrooms = useCallback(async () => {
    try {
      const data = await api.listClassrooms(token, false);
      setAllClassrooms(data);
    } catch (error) {
      console.error('Error fetching all classrooms:', error);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      if (token) {
        try {
          const [classroomsData, allClassroomsData] = await Promise.all([
            api.listClassrooms(token, true),
            api.listClassrooms(token, false)
          ]);
          
          setClassrooms(classroomsData);
          setAllClassrooms(allClassroomsData);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [token]);

      // Listen for socket events
  useEffect(() => {
    if (socket) {
      // Listen for classroom deletion events
      const handleClassroomDeleted = (data) => {
        // Remove classroom from both lists immediately
        setClassrooms(prev => prev.filter(classroom => classroom._id !== data.classroomId));
        setAllClassrooms(prev => prev.filter(classroom => classroom._id !== data.classroomId));
        
        // Show notification
        alert(data.message);
      };

      // Listen for member left classroom events  
      const handleMemberLeft = () => {
        // Refresh classroom lists to update member counts
        fetchMyClassrooms();
        fetchAllClassrooms();
      };

      socket.on('classroom_deleted', handleClassroomDeleted);
      socket.on('member_left_classroom', handleMemberLeft);

      return () => {
        socket.off('classroom_deleted', handleClassroomDeleted);
        socket.off('member_left_classroom', handleMemberLeft);
      };
    }
  }, [socket, fetchMyClassrooms, fetchAllClassrooms]);

  if (loading) {
    return (
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        {/* User Profile Section */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.username?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div>
              <div className="font-medium text-gray-900">{user?.username}</div>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <span>🟢 Online</span>
                {user?.isClassLeader && <span>• 👑 Lớp trưởng</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Bạn có muốn đăng xuất không?')) {
                logout();
              }
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Đăng xuất"
          >
            🚪
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
          <div className="flex gap-2">
            {/* Bất kỳ user nào cũng có thể tạo lớp học */}
            <button
              onClick={async () => {
                const name = window.prompt('Tên lớp học mới:');
                if (!name || name.trim() === '') return;
                try {
                  const classroom = await api.createClassroom(token, { name: name.trim() });
                  setClassrooms(prev => [classroom, ...prev]);
                  // Auto-select classroom conversation
                  if (classroom?.conversation) {
                    onSelectConversation(classroom.conversation);
                  }
                  alert(`Đã tạo lớp học "${name}" thành công! Bạn là lớp trưởng của lớp này.`);
                } catch (e) {
                  console.error('Create classroom failed', e);
                  alert('Không thể tạo lớp học. Vui lòng thử lại!');
                }
              }}
              className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-1"
              title="Tạo lớp học mới"
            >
              <span>🏫</span>
              <span className="text-sm font-medium">Tạo lớp</span>
            </button>

          </div>
        </div>

      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Conversations */}
        {classrooms.length > 0 && (
          <div>
            <h3 className="px-4 py-2 text-sm font-semibold text-purple-600 bg-purple-50">🏫 Lớp học của tôi</h3>
            {classrooms.map(cr => (
              <div
                key={cr._id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-purple-50 flex items-center space-x-3 transition-colors ${
                  selectedConversationId === cr.conversation?._id ? 'bg-purple-100 border-purple-200' : ''
                }`}
                onClick={() => cr.conversation && onSelectConversation(cr.conversation)}
              >
                <div className="text-3xl">🏫</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 truncate">{cr.name}</h3>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {cr.members?.length || 0} thành viên
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {cr.conversation?.lastMessage ? 'Có hoạt động mới' : 'Chưa có tin nhắn'}
                    </p>
                    {cr.leader?._id === user.id && (
                      <span className="text-xs text-yellow-600">👑 Lớp trưởng</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {allClassrooms.length > 0 && (
          <div>
            <h3 className="px-4 py-2 text-sm font-semibold text-green-600 bg-green-50">🌐 Tất cả lớp học</h3>
            {allClassrooms.map(cr => {
              const mine = classrooms.some(c => c._id === cr._id);
              return (
                <div
                  key={cr._id}
                  className="p-4 border-b border-gray-100 flex items-center justify-between hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🏫</div>
                    <div>
                      <div className="font-medium text-gray-900">{cr.name}</div>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>👑 {cr.leader?.username}</span>
                        <span>•</span>
                        <span>{cr.members?.length || 0} thành viên</span>
                      </div>
                    </div>
                  </div>
                  {!mine ? (
                    <button
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                      onClick={async () => {
                        try {
                          const res = await api.joinClassroom(token, cr._id);
                          await fetchMyClassrooms();
                          onSelectConversation(res?.conversation || cr.conversation);
                        } catch (e) {
                          console.error('Join classroom failed', e);
                          alert('Không thể tham gia lớp học');
                        }
                      }}
                    >
                      Tham gia
                    </button>
                  ) : (
                    <span className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      ✓ Đã tham gia
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default ConversationList;
