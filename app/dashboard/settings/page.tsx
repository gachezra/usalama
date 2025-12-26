"use client"

import { User, Shield, Bell, Key, Globe, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <span>National Oversight</span>
          <span>/</span>
          <span className="text-white">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-white">System Configuration</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="glass border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Profile Settings
            </CardTitle>
            <CardDescription className="text-slate-400">Manage your official account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Official Name</Label>
              <Input
                defaultValue="Admin User"
                className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Official ID</Label>
              <Input
                defaultValue="GOV-2024-0892"
                disabled
                className="bg-slate-900/50 border-slate-800 text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Department</Label>
              <Input
                defaultValue="National Audit Office"
                className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
              />
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="glass border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Security Settings
            </CardTitle>
            <CardDescription className="text-slate-400">Configure security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Two-Factor Authentication</Label>
                <p className="text-xs text-slate-500">Require biometric verification</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Session Timeout</Label>
                <p className="text-xs text-slate-500">Auto-logout after 15 minutes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">IP Whitelisting</Label>
                <p className="text-xs text-slate-500">Restrict access by IP address</p>
              </div>
              <Switch />
            </div>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 bg-transparent"
            >
              <Key className="w-4 h-4 mr-2" />
              Regenerate API Keys
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Notifications
            </CardTitle>
            <CardDescription className="text-slate-400">Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Risk Alerts</Label>
                <p className="text-xs text-slate-500">Notify on high-risk detections</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Citizen Reports</Label>
                <p className="text-xs text-slate-500">New verification submissions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">System Updates</Label>
                <p className="text-xs text-slate-500">Platform maintenance alerts</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card className="glass border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Integrations
            </CardTitle>
            <CardDescription className="text-slate-400">Connected services and APIs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-slate-200 font-medium">Polygon Network</p>
                  <p className="text-xs text-slate-500">Blockchain ledger</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs text-green-400">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-slate-200 font-medium">M-Pesa Gateway</p>
                  <p className="text-xs text-slate-500">Citizen payouts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs text-green-400">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
