import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  MessageCircle,
  BellOff,
  Send,
  Loader2,
  CheckCircle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import useStore from '../store/useStore';

const Toggle = ({ enabled, onChange }) => (
  <div
    onClick={onChange}
    className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
      enabled ? 'bg-ios-green' : 'bg-ios-gray-4 dark:bg-ios-gray-1/40'
    }`}
  >
    <motion.div
      animate={{ x: enabled ? 22 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
    />
  </div>
);

/**
 * NotificationSettings — settings panel for push, email, telegram, and global notifications.
 */
const NotificationSettings = () => {
  const user = useStore((s) => s.user);

  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [testingChannel, setTestingChannel] = useState(null);

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications not supported in this browser');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPushSubscribed(true);
      toast.success('Push notifications enabled!');
    } else {
      toast.error('Permission denied. Please enable in browser settings.');
    }
  };

  const sendTestNotification = async (channel) => {
    setTestingChannel(channel);
    try {
      await apiClient.post('/api/notifications/test', {
        channel,
        email: channel === 'email' ? emailAddress : undefined,
        telegramChatId: channel === 'telegram' ? telegramChatId : undefined,
      });
      toast.success(`Test ${channel} notification sent!`);
    } catch {
      toast.error(`Failed to send test ${channel} notification`);
    } finally {
      setTestingChannel(null);
    }
  };

  const saveSettings = async () => {
    try {
      await apiClient.put('/api/notifications/settings', {
        globalEnabled,
        push: pushEnabled,
        email: emailEnabled,
        emailAddress,
        telegram: telegramEnabled,
        telegramChatId,
      });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-4">
      {/* Global toggle */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-apple p-4 shadow-apple">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ios-blue/10 flex items-center justify-center">
              {globalEnabled ? (
                <Bell className="w-5 h-5 text-ios-blue" />
              ) : (
                <BellOff className="w-5 h-5 text-ios-gray-1" />
              )}
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">All Notifications</p>
              <p className="text-xs text-ios-gray-1">Master toggle for all alerts</p>
            </div>
          </div>
          <Toggle enabled={globalEnabled} onChange={() => setGlobalEnabled((e) => !e)} />
        </div>
      </div>

      {/* Channels */}
      <div className={`space-y-3 transition-opacity ${globalEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        {/* Push Notifications */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-apple shadow-apple overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-ios-orange/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-ios-orange" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Push Notifications</p>
                <p className="text-xs text-ios-gray-1">Browser & in-app alerts</p>
              </div>
            </div>
            <Toggle enabled={pushEnabled} onChange={() => setPushEnabled((e) => !e)} />
          </div>

          {pushEnabled && (
            <div className="px-4 pb-4 space-y-2 border-t border-ios-gray-5 dark:border-ios-gray-1/10 pt-3">
              {!pushSubscribed ? (
                <button
                  onClick={requestPushPermission}
                  className="flex items-center gap-2 text-sm font-semibold text-ios-blue hover:opacity-80 transition-opacity"
                >
                  <Bell className="w-4 h-4" />
                  Subscribe to browser push
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-ios-green font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Browser push active
                </div>
              )}
              <button
                onClick={() => sendTestNotification('push')}
                disabled={testingChannel === 'push'}
                className="flex items-center gap-1.5 text-xs text-ios-gray-1 hover:text-ios-blue transition-colors disabled:opacity-50"
              >
                {testingChannel === 'push' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send test notification
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-apple shadow-apple overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-ios-blue/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-ios-blue" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Email</p>
                <p className="text-xs text-ios-gray-1">Price drop alerts via email</p>
              </div>
            </div>
            <Toggle enabled={emailEnabled} onChange={() => setEmailEnabled((e) => !e)} />
          </div>

          {emailEnabled && (
            <div className="px-4 pb-4 space-y-3 border-t border-ios-gray-5 dark:border-ios-gray-1/10 pt-3">
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="your@email.com"
                className="input-apple text-sm"
              />
              <button
                onClick={() => sendTestNotification('email')}
                disabled={testingChannel === 'email' || !emailAddress}
                className="flex items-center gap-1.5 text-xs text-ios-gray-1 hover:text-ios-blue transition-colors disabled:opacity-50"
              >
                {testingChannel === 'email' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send test email
              </button>
            </div>
          )}
        </div>

        {/* Telegram */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-apple shadow-apple overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-ios-teal/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-ios-teal" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Telegram</p>
                <p className="text-xs text-ios-gray-1">Bot message via Telegram</p>
              </div>
            </div>
            <Toggle enabled={telegramEnabled} onChange={() => setTelegramEnabled((e) => !e)} />
          </div>

          {telegramEnabled && (
            <div className="px-4 pb-4 space-y-3 border-t border-ios-gray-5 dark:border-ios-gray-1/10 pt-3">
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Your Telegram Chat ID"
                className="input-apple text-sm"
              />
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-ios-blue hover:opacity-80 transition-opacity"
              >
                <ExternalLink className="w-3 h-3" />
                Get your Chat ID from @userinfobot
              </a>
              <button
                onClick={() => sendTestNotification('telegram')}
                disabled={testingChannel === 'telegram' || !telegramChatId}
                className="flex items-center gap-1.5 text-xs text-ios-gray-1 hover:text-ios-blue transition-colors disabled:opacity-50"
              >
                {testingChannel === 'telegram' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send test Telegram message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <motion.button
        onClick={saveSettings}
        whileTap={{ scale: 0.97 }}
        className="btn-primary w-full"
      >
        Save Notification Settings
      </motion.button>
    </div>
  );
};

export default NotificationSettings;
