import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, LogOut, Bell, User, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';
import NotificationSettings from '../components/NotificationSettings';
import toast from 'react-hot-toast';

const SettingRow = ({ icon: Icon, iconColor, label, subtitle, onClick, danger, rightElement }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 bg-[var(--bg-secondary)] rounded-apple shadow-apple text-left transition-colors hover:bg-[var(--bg-tertiary)] ${danger ? 'hover:bg-ios-red/5' : ''}`}
  >
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${iconColor}18` }}
    >
      <Icon className="w-4 h-4" style={{ color: iconColor }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold ${danger ? 'text-ios-red' : 'text-[var(--text-primary)]'}`}>
        {label}
      </p>
      {subtitle && <p className="text-xs text-ios-gray-1 mt-0.5">{subtitle}</p>}
    </div>
    {rightElement || <ChevronRight className="w-4 h-4 text-ios-gray-2 flex-shrink-0" />}
  </motion.button>
);

const Settings = () => {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-ios-gray-5/60 flex items-center justify-center">
            <SettingsIcon className="w-4 h-4 text-ios-gray-1" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Settings</h1>
        </div>
      </motion.div>

      {/* Profile Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.05 }}
          className="bg-[var(--bg-secondary)] rounded-apple shadow-apple p-4 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ios-blue to-ios-purple flex items-center justify-center text-white text-xl font-black flex-shrink-0">
            {user.name ? user.name[0].toUpperCase() : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--text-primary)] truncate">{user.name}</p>
            <p className="text-sm text-ios-gray-1 truncate">{user.email}</p>
          </div>
        </motion.div>
      )}

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
        className="space-y-2"
      >
        <p className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wider px-1">
          Notifications
        </p>
        <SettingRow
          icon={Bell}
          iconColor="#007AFF"
          label="Notification Settings"
          subtitle="Push, Email, Telegram"
          onClick={() => setNotifOpen((o) => !o)}
        />
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <NotificationSettings />
          </motion.div>
        )}
      </motion.div>

      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.15 }}
        className="space-y-2"
      >
        <p className="text-xs font-semibold text-ios-gray-1 uppercase tracking-wider px-1">
          Account
        </p>
        <SettingRow
          icon={User}
          iconColor="#AF52DE"
          label="Profile"
          subtitle={user?.email}
          onClick={() => {}}
        />
        <SettingRow
          icon={LogOut}
          iconColor="#FF3B30"
          label="Sign Out"
          danger
          onClick={handleLogout}
          rightElement={<span />}
        />
      </motion.div>

      {/* App Info */}
      <p className="text-center text-xs text-ios-gray-2 pb-4">
        PriceHawk v1.0 · Made with 🦅
      </p>
    </div>
  );
};

export default Settings;
