import React from 'react';
import { 
  FiX, 
  FiFileText, 
  FiBriefcase, 
  FiBookOpen, 
  FiAward, 
  FiMail, 
  FiGithub, 
  FiExternalLink, 
  FiShield, 
  FiCheck,
  FiCode
} from 'react-icons/fi';
import StarRating from './StarRating';

export default function FreelancerResumeModal({ freelancer, isOpen, onClose }) {
  if (!isOpen || !freelancer) return null;

  const resume = freelancer.resumeData || {};
  const skills = resume.skills?.length > 0 ? resume.skills : (freelancer.skills || []);
  const education = resume.education || [];
  const experience = resume.experience || [];
  const certifications = resume.certifications || [];
  const projects = freelancer.portfolioProjects || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900/90 p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              <FiFileText /> Verified Freelancer Resume
            </span>
            {resume.fileName && (
              <span className="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                {resume.fileName}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
            <div>
              <h3 className="text-2xl font-black text-white">{freelancer.name}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200 mt-1">
                <span className="flex items-center gap-1"><FiMail /> {freelancer.email}</span>
                {freelancer.hourlyRate && (
                  <span className="font-bold text-emerald-400">₹{freelancer.hourlyRate}/hr</span>
                )}
                {freelancer.githubUsername && (
                  <a
                    href={freelancer.githubUrl || `https://github.com/${freelancer.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-white hover:text-indigo-300 underline font-bold"
                  >
                    <FiGithub /> @{freelancer.githubUsername}
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-2xl border border-white/10">
              <span className="text-xs text-gray-300">Rating:</span>
              <StarRating value={freelancer.rating || 5} readOnly size="sm" />
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 bg-slate-900/80 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* Career Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
              <FiBriefcase className="text-purple-400" /> Career Summary
            </h4>
            <p className="text-xs md:text-sm text-gray-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
              {resume.summary || freelancer.bio || "Professional software engineer proficient in scalable applications and modern development."}
            </p>
          </div>

          {/* Extracted Resume Skills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
              <FiCode className="text-purple-400" /> Extracted Skills & Core Competencies ({skills.length})
            </h4>
            {skills.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No skills listed.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <FiCheck className="text-indigo-400 text-[10px]" /> {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Work Experience */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
              <FiBriefcase className="text-purple-400" /> Work Experience & Projects ({experience.length})
            </h4>
            {experience.length === 0 ? (
              <p className="text-xs text-gray-400 italic bg-white/5 p-3 rounded-xl border border-white/10">No formal experience entries listed in resume.</p>
            ) : (
              <div className="space-y-3">
                {experience.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-xs text-white">{exp.role} • <span className="text-purple-300">{exp.company}</span></h5>
                      <span className="text-[11px] text-gray-400 font-semibold">{exp.duration}</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
              <FiBookOpen className="text-purple-400" /> Education & Qualifications
            </h4>
            {education.length === 0 ? (
              <p className="text-xs text-gray-400 italic bg-white/5 p-3 rounded-xl border border-white/10">No education entries specified.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                    <h5 className="font-bold text-xs text-white">{edu.degree}</h5>
                    <p className="text-xs text-purple-300">{edu.institution}</p>
                    <span className="text-[10px] text-gray-400 block">{edu.year}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
                <FiAward className="text-purple-400" /> Certifications & Accreditations
              </h4>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, idx) => (
                  <span key={idx} className="bg-purple-900/40 text-purple-200 border border-purple-400/30 px-3 py-1.5 rounded-xl text-xs font-semibold">
                    📜 {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Projects */}
          {projects.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
                <FiGithub className="text-purple-400" /> Portfolio & GitHub Projects ({projects.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-xs text-white">{proj.title}</h5>
                      {proj.repoUrl && (
                        <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="text-purple-300 hover:text-white text-xs">
                          <FiExternalLink />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 line-clamp-2">{proj.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(proj.techStack || []).map((t, ti) => (
                        <span key={ti} className="text-[9px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Resume
          </button>
        </div>

      </div>
    </div>
  );
}
