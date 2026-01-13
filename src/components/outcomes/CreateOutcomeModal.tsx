'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOutcome: (question: string, options: string[]) => Promise<void>;
}

export default function CreateOutcomeModal({ isOpen, onClose, onCreateOutcome }: CreateOutcomeModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isCreating, setIsCreating] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (question.trim() === '' || validOptions.length < 2) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateOutcome(question.trim(), validOptions);
      setQuestion('');
      setOptions(['', '']);
      onClose();
    } catch (error) {
      console.error('Failed to create outcome:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = question.trim() !== '' && options.filter((opt) => opt.trim() !== '').length >= 2;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity" onClick={onClose} />

        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create a Bet</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Will Sarah arrive before 7pm?"
                className="mt-1 block w-full rounded-md border-gray-300 px-1 py-1 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">What do you want to predict? (max 500 characters)</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Options</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 rounded-md border-gray-300 px-1 py-1 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      maxLength={100}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Option
                </button>
              )}

              <p className="mt-2 text-xs text-gray-500">Add 2-10 options for people to bet on</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isCreating}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Market'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
