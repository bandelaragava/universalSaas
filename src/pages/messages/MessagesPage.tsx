import { useState } from 'react'
import { Hash, Megaphone, Send, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const channels = [
  { id: 'general', name: 'general', type: 'public', unread: 0 },
  { id: 'sales', name: 'sales-team', type: 'role', unread: 3 },
  { id: 'hr', name: 'hr-announcements', type: 'announcement', unread: 1 },
  { id: 'support', name: 'support-internal', type: 'public', unread: 0 },
]

const messages = [
  { id: '1', user: 'Sarah Chen', text: 'Q2 targets updated in CRM - please review.', time: '10:32 AM' },
  { id: '2', user: 'Mike Johnson', text: 'New lead from Meta campaign assigned to sales.', time: '10:45 AM' },
  { id: '3', user: 'Alex Morgan', text: 'All hands meeting at 3 PM today.', time: '11:02 AM' },
]

const onlineUsers = [
  { name: 'Sarah Chen', status: 'online' },
  { name: 'Mike Johnson', status: 'online' },
  { name: 'Raj Patel', status: 'away' },
  { name: 'Lisa Wong', status: 'online' },
]

export function MessagesPage() {
  const [activeChannel, setActiveChannel] = useState('general')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Messages & Community"
        description="Internal communication, channels, and announcements."
      />
      <div className="grid h-auto lg:h-[calc(100vh-12rem)] gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-3 flex flex-col overflow-hidden h-[300px] lg:h-full">
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="border-b border-border p-3">
              <Input placeholder="Search channels..." className="h-8" />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">Channels</p>
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChannel(ch.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm',
                      activeChannel === ch.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                    )}
                  >
                    {ch.type === 'announcement' ? (
                      <Megaphone className="h-4 w-4 shrink-0" />
                    ) : (
                      <Hash className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{ch.name}</span>
                    {ch.unread > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 justify-center px-1">{ch.unread}</Badge>
                    )}
                  </button>
                ))}
                <p className="mt-4 px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">Direct Messages</p>
                {['Raj Patel', 'Lisa Wong'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">{name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    {name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6 flex flex-col overflow-hidden h-[500px] lg:h-full">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Hash className="h-4 w-4" />
            <span className="font-semibold">{activeChannel}</span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{m.user.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{m.user}</span>
                      <span className="text-xs text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2 border-t border-border p-3">
            <Input placeholder={`Message #${activeChannel}`} className="flex-1" />
            <Button size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </Card>

        <Card className="hidden lg:block lg:col-span-3 h-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              Online - {onlineUsers.filter((u) => u.status === 'online').length}
            </div>
            <ul className="mt-4 space-y-2">
              {onlineUsers.map((u) => (
                <li key={u.name} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      u.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                  />
                  {u.name}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-lg border border-dashed border-border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Announcements</p>
              <p className="mt-2 text-sm">Company-wide policy update - May 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




