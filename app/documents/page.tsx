'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, Calendar, User, TrendingUp } from 'lucide-react';

interface Document {
  id: string;
  carrier_name: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  updated_at: string;
  writing_agents_count: number;
  uploader: {
    full_name: string;
    email: string;
  };
}

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserRole(profile.role);
    }

    await loadDocuments();
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load documents');
      }

      setDocuments(data.documents || []);
    } catch (err: any) {
      console.error('Load documents error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, carrier: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('carrier', carrier);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${carrier} document! Found ${data.writingAgentsCount} writing agents.`,
      });

      // Reload documents
      await loadDocuments();

      // Clear file input
      e.target.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatus({
        type: 'error',
        message: err.message || 'Failed to upload document',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  const carriers = ['American Amicable', 'Aflac', 'Aetna', 'Combined'];
  const isAgencyOwner = userRole === 'agency_owner';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
              <p className="text-gray-600 mt-1">
                {isAgencyOwner
                  ? 'Upload and manage carrier policy reports'
                  : 'View uploaded carrier documents'}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Status */}
        {uploadStatus && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              uploadStatus.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                uploadStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {uploadStatus.message}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Not Agency Owner Message */}
        {!isAgencyOwner && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Only agency owners can upload documents. Contact your agency owner to upload new policy reports.
            </p>
          </div>
        )}

        {/* Upload Cards */}
        {isAgencyOwner && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {carriers.map((carrier) => {
              const existingDoc = documents.find((d) => d.carrier_name === carrier);

              return (
                <div
                  key={carrier}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{carrier}</h3>
                    {existingDoc && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Uploaded
                      </span>
                    )}
                  </div>

                  {existingDoc && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                      <p className="text-gray-700">
                        <strong>File:</strong> {existingDoc.file_name}
                      </p>
                      <p className="text-gray-700">
                        <strong>Agents:</strong> {existingDoc.writing_agents_count}
                      </p>
                      <p className="text-gray-700">
                        <strong>Updated:</strong>{' '}
                        {new Date(existingDoc.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <label
                    className={`
                      flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer
                      ${uploading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }
                    `}
                  >
                    <Upload className="w-4 h-4" />
                    {existingDoc ? 'Update' : 'Upload'}
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, carrier)}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Uploaded Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents uploaded yet</p>
              {isAgencyOwner && (
                <p className="text-sm text-gray-500 mt-2">
                  Upload carrier policy reports above to get started
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {doc.carrier_name}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {doc.file_name}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>{doc.writing_agents_count} Writing Agents</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Updated {new Date(doc.updated_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>By {doc.uploader.full_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

