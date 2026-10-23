import React from 'react';
import { 
  FiX, 
  FiAward, 
  FiDownload, 
  FiExternalLink, 
  FiCalendar, 
  FiCheckCircle, 
  FiFileText,
  FiShield
} from 'react-icons/fi';

export default function CertificateViewModal({ certificate, isOpen, onClose, recipientName }) {
  if (!isOpen || !certificate) return null;

  const isImage = certificate.fileType === 'image' || (certificate.fileUrl && certificate.fileUrl.startsWith('data:image'));
  const isPdf = certificate.fileType === 'pdf' || (certificate.fileUrl && certificate.fileUrl.startsWith('data:application/pdf'));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/90 via-yellow-950/90 to-slate-900/90 p-6 relative border-b border-amber-500/20">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <FiAward className="text-yellow-400" /> Verified Skill Certificate
            </span>
            {certificate.issuer && (
              <span className="bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-white/10">
                {certificate.issuer}
              </span>
            )}
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white mt-1">
            {certificate.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-200/90 mt-2">
            {certificate.issueDate && (
              <span className="flex items-center gap-1 font-medium">
                <FiCalendar className="text-amber-400" /> Issued: {certificate.issueDate}
              </span>
            )}
            {certificate.credentialId && (
              <span className="bg-slate-900/80 px-2.5 py-0.5 rounded-md text-[10px] font-mono border border-amber-500/30 text-amber-300">
                ID: {certificate.credentialId}
              </span>
            )}
            {recipientName && (
              <span className="text-slate-300">
                Awarded to: <strong className="text-white">{recipientName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-slate-900/90 space-y-5 max-h-[72vh] overflow-y-auto">
          
          {/* Skills Showcased */}
          {Array.isArray(certificate.skills) && certificate.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-400" /> Skills Demonstrated & Certified:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {certificate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-500/15 text-amber-200 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certificate Proof Preview */}
          <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950/60 p-4">
            {certificate.fileUrl ? (
              <div>
                {isImage ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={certificate.fileUrl} 
                      alt={certificate.title} 
                      className="max-h-96 w-auto object-contain rounded-xl shadow-lg border border-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">Document image verified and loaded from freelancer credentials</p>
                  </div>
                ) : isPdf ? (
                  <div className="space-y-3 text-center py-4">
                    <iframe
                      src={certificate.fileUrl}
                      title={certificate.title}
                      className="w-full h-80 rounded-xl border border-slate-800 bg-white"
                    />
                    <a
                      href={certificate.fileUrl}
                      download={certificate.fileName || `${certificate.title}.pdf`}
                      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      <FiDownload /> Download Certificate PDF ({certificate.fileName || 'certificate.pdf'})
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <a
                      href={certificate.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      <FiExternalLink /> Open Certificate Document
                    </a>
                  </div>
                )}
              </div>
            ) : (
              /* High-fidelity Certificate Badge Presentation */
              <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 rounded-2xl border-2 border-amber-500/40 text-center space-y-4 shadow-inner">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow-lg">
                  🏆
                </div>
                
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                    CERTIFICATE OF PROFESSIONAL ACCOMPLISHMENT
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    {certificate.title}
                  </h4>
                  <p className="text-xs text-amber-200/90 mt-1">
                    Issued by <strong className="text-white">{certificate.issuer || 'Accredited Institution'}</strong>
                  </p>
                </div>

                <div className="max-w-md mx-auto pt-3 border-t border-amber-500/30 text-xs text-slate-300">
                  <p>
                    This verifies that <strong className="text-white">{recipientName || 'Freelancer'}</strong> has demonstrated mastery in <strong className="text-amber-300">{(certificate.skills || []).join(', ') || 'Software Development'}</strong> as verified by {certificate.issuer || 'Issuing Authority'}.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-slate-400 font-mono">
                  {certificate.issueDate && <span>Year: {certificate.issueDate}</span>}
                  {certificate.credentialId && <span>Credential ID: {certificate.credentialId}</span>}
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <FiShield className="text-emerald-400" /> Platform Verified
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Verification Link */}
          {certificate.credentialUrl && (
            <div className="flex justify-center">
              <a
                href={certificate.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-bold"
              >
                <FiExternalLink /> Verify Official Credential on Issuer Site
              </a>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            {certificate.fileName ? `File: ${certificate.fileName}` : 'Verified Freelancer Credential'}
          </span>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
