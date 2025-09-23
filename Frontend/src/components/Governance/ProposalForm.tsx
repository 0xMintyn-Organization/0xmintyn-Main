'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X, Upload, FileText, Image, Link } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const proposalSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title cannot exceed 200 characters'),
  category: z.enum(['Platform Upgrade', 'Policy Change', 'Treasury Allocation', 'UBI Distribution', 'AI/Tech Development', 'Community Engagement', 'Other']),
  summary: z.string().min(20, 'Summary must be at least 20 characters').max(500, 'Summary cannot exceed 500 characters'),
  detailedDescription: z.string().min(50, 'Detailed description must be at least 50 characters').max(5000, 'Detailed description cannot exceed 5000 characters'),
  expectedImpact: z.string().min(20, 'Expected impact must be at least 20 characters').max(2000, 'Expected impact cannot exceed 2000 characters'),
  implementationPlan: z.string().min(20, 'Implementation plan must be at least 20 characters').max(3000, 'Implementation plan cannot exceed 3000 characters'),
  resourcesNeeded: z.string().min(10, 'Resources needed must be at least 10 characters').max(1000, 'Resources needed cannot exceed 1000 characters'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  milestones: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).optional()
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  onSubmit: (data: ProposalFormData) => void;
}

const categories = [
  'Platform Upgrade',
  'Policy Change', 
  'Treasury Allocation',
  'UBI Distribution',
  'AI/Tech Development',
  'Community Engagement',
  'Other'
];

const ProposalForm: React.FC<ProposalFormProps> = ({ onSubmit }) => {
  const [milestones, setMilestones] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<Array<{name: string, url: string, type: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      milestones: [''],
      attachments: []
    }
  });

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  const addMilestone = () => {
    setMilestones([...milestones, '']);
  };

  const removeMilestone = (index: number) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(newMilestones);
    setValue('milestones', newMilestones);
  };

  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = value;
    setMilestones(newMilestones);
    setValue('milestones', newMilestones);
  };

  const addAttachment = () => {
    setAttachments([...attachments, { name: '', url: '', type: 'link' }]);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setValue('attachments', newAttachments);
  };

  const updateAttachment = (index: number, field: 'name' | 'url' | 'type', value: string) => {
    const newAttachments = [...attachments];
    newAttachments[index][field] = value;
    setAttachments(newAttachments);
    setValue('attachments', newAttachments);
  };

  const onFormSubmit = async (data: ProposalFormData) => {
    try {
      setIsSubmitting(true);
      
      // Filter out empty milestones
      const filteredMilestones = data.milestones?.filter(milestone => milestone.trim() !== '') || [];
      
      // Filter out empty attachments
      const filteredAttachments = data.attachments?.filter(attachment => 
        attachment.name.trim() !== '' && attachment.url.trim() !== ''
      ) || [];

      const proposalData = {
        ...data,
        milestones: filteredMilestones,
        attachments: filteredAttachments,
        timeline: {
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          milestones: filteredMilestones
        }
      };

      console.log('Submitting proposal data:', proposalData);
      await onSubmit(proposalData);
      
      // Reset form after successful submission
      reset();
      setMilestones(['']);
      setAttachments([]);
    } catch (error) {
      console.error('Error submitting proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Basic Information</CardTitle>
          <CardDescription>
            Provide the essential details about your proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Proposal Title *
            </label>
            <Input
              id="title"
              placeholder="Enter a clear, descriptive title for your proposal"
              {...register('title')}
              className={cn(errors.title && 'border-red-500')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category *
            </label>
            <Select onValueChange={(value) => setValue('category', value as ProposalFormData['category'])}>
              <SelectTrigger className={cn(errors.category && 'border-red-500')}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proposal Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. Proposal Content</CardTitle>
          <CardDescription>
            Describe your proposal in detail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="summary" className="text-sm font-medium">
              Summary (2-3 sentences max) *
            </label>
            <Textarea
              id="summary"
              placeholder="Provide a brief summary of your proposal"
              rows={3}
              {...register('summary')}
              className={cn(errors.summary && 'border-red-500')}
            />
            {errors.summary && (
              <p className="text-sm text-red-500">{errors.summary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="detailedDescription" className="text-sm font-medium">
              Detailed Description *
            </label>
            <Textarea
              id="detailedDescription"
              placeholder="Provide a comprehensive description of your proposal"
              rows={6}
              {...register('detailedDescription')}
              className={cn(errors.detailedDescription && 'border-red-500')}
            />
            {errors.detailedDescription && (
              <p className="text-sm text-red-500">{errors.detailedDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="expectedImpact" className="text-sm font-medium">
              Expected Impact *
            </label>
            <Textarea
              id="expectedImpact"
              placeholder="Describe the expected impact and benefits of your proposal"
              rows={4}
              {...register('expectedImpact')}
              className={cn(errors.expectedImpact && 'border-red-500')}
            />
            {errors.expectedImpact && (
              <p className="text-sm text-red-500">{errors.expectedImpact.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="implementationPlan" className="text-sm font-medium">
              Implementation Plan *
            </label>
            <Textarea
              id="implementationPlan"
              placeholder="Outline the step-by-step implementation plan"
              rows={5}
              {...register('implementationPlan')}
              className={cn(errors.implementationPlan && 'border-red-500')}
            />
            {errors.implementationPlan && (
              <p className="text-sm text-red-500">{errors.implementationPlan.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. Timeline & Resources</CardTitle>
          <CardDescription>
            Set the voting timeline and resource requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voting Start Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedStartDate && 'text-muted-foreground',
                      errors.startDate && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedStartDate ? format(watchedStartDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedStartDate}
                    onSelect={(date) => setValue('startDate', date!)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Voting End Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedEndDate && 'text-muted-foreground',
                      errors.endDate && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedEndDate ? format(watchedEndDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedEndDate}
                    onSelect={(date) => setValue('endDate', date!)}
                    disabled={(date) => date < (watchedStartDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="resourcesNeeded" className="text-sm font-medium">
              Resources Needed *
            </label>
            <Textarea
              id="resourcesNeeded"
              placeholder="Describe the resources needed for implementation (e.g., internal dev team, external support)"
              rows={3}
              {...register('resourcesNeeded')}
              className={cn(errors.resourcesNeeded && 'border-red-500')}
            />
            {errors.resourcesNeeded && (
              <p className="text-sm text-red-500">{errors.resourcesNeeded.message}</p>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Implementation Milestones (Optional)</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestone}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Milestone
              </Button>
            </div>
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Milestone ${index + 1}`}
                  value={milestone}
                  onChange={(e) => updateMilestone(index, e.target.value)}
                  className="flex-1"
                />
                {milestones.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMilestone(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4. Attachments (Optional)</CardTitle>
          <CardDescription>
            Add supporting documents, images, or links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attachments.map((attachment, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Attachment {index + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input
                    placeholder="Document name"
                    value={attachment.name}
                    onChange={(e) => updateAttachment(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <Select
                    value={attachment.type}
                    onValueChange={(value) => updateAttachment(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">URL</label>
                  <Input
                    placeholder="https://example.com"
                    value={attachment.url}
                    onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addAttachment}
            className="w-full flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Add Attachment
          </Button>
        </CardContent>
      </Card>

      {/* Voting Options Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-xl text-blue-900 dark:text-blue-100">5. Voting Options</CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Voting options will be automatically generated by the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-blue-900 rounded-lg">
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">YES</p>
                <p className="text-xs text-green-600 dark:text-green-400">Approve and implement</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-blue-900 rounded-lg">
              <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-sm font-bold">✗</span>
              </div>
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">NO</p>
                <p className="text-xs text-red-600 dark:text-red-400">Reject proposal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-blue-900 rounded-lg">
              <div className="h-8 w-8 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">○</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">ABSTAIN</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Neutral / no opinion</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-xl text-green-900 dark:text-green-100">6. Submission</CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            Your proposal will be immediately active and available for community voting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-green-900 rounded-lg">
            <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm">🟡</span>
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Status: Active</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                No admin approval required - your proposal will be live immediately
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? 'Creating Proposal...' : 'Create Proposal'}
        </Button>
      </div>
    </form>
  );
};

export default ProposalForm;
