import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardActions } from '@/context/DashboardActionContext'
import { useToast } from '@/context/ToastContext'
import { quickActionMap, type QuickActionId } from '@/config/quick-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import DynamicFormRenderer from '@/modules/leads/renderer/DynamicFormRenderer'
import CreateTask from '@/modules/tasks/pages/CreateTask'
import { TaskProvider } from '@/modules/tasks/context/TaskContext'
import UserForm from '@/pages/UserForm'
import CreateTicket from '@/pages/tickets/CreateTicket'
import CreateFollowup from '@/modules/leads/pages/CreateFollowup'

const dialogTitles: Record<QuickActionId, string> = {
  'add-user': 'Add User',
  'add-lead': 'Add Lead',
  'create-task': 'Create Task',
  ticket: 'Create Support Ticket',
  announce: 'Send Announcement',
  followup: 'Create Followup',
}

export function QuickActionDialogs() {
  const { activeAction, closeAction } = useDashboardActions()
  const { success } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!activeAction) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))

    const form = new FormData(e.currentTarget)

    switch (activeAction) {
      case 'announce':
        success('Announcement sent', `Broadcast "${form.get('title')}" to all channels`)
        navigate('/messages')
        break
    }

    setLoading(false)
    closeAction()
  }

  if (!activeAction || !quickActionMap[activeAction]?.hasDialog) return null

  return (
    <Dialog open={!!activeAction} onOpenChange={(open) => !open && closeAction()}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          ['add-user', 'add-lead', 'create-task'].includes(activeAction) && "sm:max-w-4xl max-h-[90vh] overflow-y-auto",
          ['ticket', 'followup'].includes(activeAction) && "sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        )}
      >
        <DialogHeader>
          <DialogTitle className={['add-user', 'add-lead', 'create-task'].includes(activeAction) ? "sr-only" : ""}>
            {dialogTitles[activeAction]}
          </DialogTitle>
        </DialogHeader>

        {activeAction === 'add-user' ? (
          <UserForm onClose={closeAction} />
        ) : activeAction === 'add-lead' ? (
          <DynamicFormRenderer onClose={closeAction} />
        ) : activeAction === 'create-task' ? (
          <TaskProvider>
            <CreateTask onClose={closeAction} />
          </TaskProvider>
        ) : activeAction === 'ticket' ? (
          <CreateTicket onClose={closeAction} onSuccess={() => navigate('/tickets')} />
        ) : activeAction === 'followup' ? (
          <CreateFollowup onClose={closeAction} onSuccess={() => navigate('/leads/follow-ups')} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeAction === 'announce' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input name="title" required placeholder="Company update" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Input name="message" required placeholder="Announcement body" />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeAction} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
