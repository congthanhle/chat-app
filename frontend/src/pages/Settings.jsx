// src/pages/Settings.jsx
export default function Settings() {
  return (
    <div className="p-6">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">Settings</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Message Notifications</p>
                    <p className="text-sm text-gray-500">Get notified when you receive new messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sound Notifications</p>
                    <p className="text-sm text-gray-500">Play sound for new messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select className="w-full max-w-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Light</option>
                    <option>Dark</option>
                    <option>System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select className="w-full max-w-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>English</option>
                    <option>Vietnamese</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Online Status</p>
                    <p className="text-sm text-gray-500">Let others see when you're online</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Read Receipts</p>
                    <p className="text-sm text-gray-500">Show when you've read messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
              <div className="border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t">
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
