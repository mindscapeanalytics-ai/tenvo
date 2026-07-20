import { prismaBase as prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Search, Copy } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Affiliate Applications | Admin',
};

async function updateAffiliateStatus(formData) {
  'use server';
  const id = formData.get('id');
  const action = formData.get('action'); // 'approve' or 'reject'
  
  if (!id || !action) return;

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  await prisma.affiliates.update({
    where: { id },
    data: { status: newStatus }
  });

  revalidatePath('/admin/affiliates');
}

export default async function AdminAffiliatesPage() {
  const affiliates = await prisma.affiliates.findMany({
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Affiliates</h1>
          <p className="text-zinc-500 mt-1">Review and manage partner program applications.</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium">Partner Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Referral Code</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {affiliates.map((aff) => (
                <tr key={aff.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900">{aff.name}</td>
                  <td className="px-6 py-4 text-zinc-500">{aff.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      aff.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      aff.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {aff.status.charAt(0).toUpperCase() + aff.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-600 text-xs">
                    {aff.status === 'approved' ? aff.referral_code : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {aff.status === 'pending' && (
                      <form action={updateAffiliateStatus} className="inline-flex items-center gap-2">
                        <input type="hidden" name="id" value={aff.id} />
                        <Button type="submit" name="action" value="approve" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 px-3">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                        </Button>
                        <Button type="submit" name="action" value="reject" size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg h-8 px-3">
                          <XCircle className="w-4 h-4 mr-1.5" /> Reject
                        </Button>
                      </form>
                    )}
                    {aff.status === 'approved' && (
                      <span className="text-zinc-400 text-xs font-medium">Approved</span>
                    )}
                    {aff.status === 'rejected' && (
                      <span className="text-zinc-400 text-xs font-medium">Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {affiliates.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
