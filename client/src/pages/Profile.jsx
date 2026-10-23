import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FiEdit2, 
  FiMail, 
  FiStar, 
  FiAward, 
  FiCheck, 
  FiSmartphone, 
  FiGrid, 
  FiUpload, 
  FiShield,
  FiTrash2,
  FiZap,
  FiCpu,
  FiX,
  FiGithub,
  FiFileText,
  FiExternalLink,
  FiPlus,
  FiFolder,
  FiBookOpen,
  FiBriefcase,
  FiFile,
  FiCode,
  FiEye,
  FiCalendar
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(user || {});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrPreview, setQrPreview] = useState(user?.upiQrCode || '');

  // Active Profile Tab: 'overview' | 'projects' | 'resume'
  const [profileTab, setProfileTab] = useState('overview');

  // GITHUB EXTRACTOR MODAL STATE
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [githubInput, setGithubInput] = useState(user?.githubUsername || 'rishicloud08');
  const [syncingGitHub, setSyncingGitHub] = useState(false);

  // RESUME UPLOADER & EDITABLE STATE
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumeUploadMode, setResumeUploadMode] = useState('pdf'); // 'pdf' | 'text'
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileBase64, setResumeFileBase64] = useState('');
  const [resumeTextInput, setResumeTextInput] = useState('');
  const [parsingResume, setParsingResume] = useState(false);
  const normalizeResumeData = (data, bio = '') => {
    if (!data || typeof data !== 'object') {
      return {
        summary: bio || '',
        education: [],
        experience: [],
        certifications: [],
        skills: [],
        fileName: ''
      };
    }

    const safeSkills = Array.isArray(data.skills)
      ? data.skills.map(s => typeof s === 'string' ? s.trim() : (s?.name || s?.skill || String(s || '')).trim()).filter(Boolean)
      : (typeof data.skills === 'string' && data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const safeEducation = Array.isArray(data.education)
      ? data.education.map(e => ({
          institution: typeof e?.institution === 'string' ? e.institution : (e?.institution?.name || String(e?.institution || 'Institution')),
          degree: typeof e?.degree === 'string' ? e.degree : (e?.degree?.name || String(e?.degree || 'Degree')),
          year: typeof e?.year === 'string' || typeof e?.year === 'number' ? String(e.year) : '2020 - 2024'
        }))
      : [];

    const safeExperience = Array.isArray(data.experience)
      ? data.experience.map(exp => ({
          role: typeof exp?.role === 'string' ? exp.role : (exp?.role?.title || String(exp?.role || 'Software Engineer')),
          company: typeof exp?.company === 'string' ? exp.company : (exp?.company?.name || String(exp?.company || 'Company')),
          duration: typeof exp?.duration === 'string' || typeof exp?.duration === 'number' ? String(exp.duration) : '2023 - Present',
          description: typeof exp?.description === 'string'
            ? exp.description
            : (Array.isArray(exp?.description) 
                ? exp.description.map(d => typeof d === 'string' ? d : JSON.stringify(d)).join(' • ') 
                : String(exp?.description || ''))
        }))
      : [];

    const safeCerts = Array.isArray(data.certifications)
      ? data.certifications.map(c => typeof c === 'string' ? c.trim() : (c?.name || c?.title || String(c || '')).trim()).filter(Boolean)
      : (typeof data.certifications === 'string' && data.certifications ? data.certifications.split(',').map(c => c.trim()).filter(Boolean) : []);

    let cleanSummary = '';
    if (typeof data.summary === 'string') {
      cleanSummary = data.summary;
    } else if (data.summary && typeof data.summary === 'object') {
      cleanSummary = data.summary.text || data.summary.summary || JSON.stringify(data.summary);
    } else {
      cleanSummary = bio || '';
    }

    return {
      summary: cleanSummary,
      skills: safeSkills,
      education: safeEducation,
      experience: safeExperience,
      certifications: safeCerts,
      fileName: typeof data.fileName === 'string' ? data.fileName : '',
      uploadedAt: data.uploadedAt
    };
  };

  const [resumeData, setResumeData] = useState(() => normalizeResumeData(user?.resumeData, user?.bio));
  const [isEditingResume, setIsEditingResume] = useState(false);

  // SKILL QUIZ STATE
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizSkill, setQuizSkill] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [rawQuizQuestions, setRawQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    fetchReviews();
    if (user) {
      setProfileData(user);
      setQrPreview(user.upiQrCode || '');
      setGithubInput(user.githubUsername || 'rishicloud08');
      setResumeData(normalizeResumeData(user.resumeData, user.bio));
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user?._id) return;
    try {
      const res = await api.reviews.getUserReviews(user._id);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log('Review load note:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. EXTRACT FROM GITHUB PROFILE & REPOSITORIES
  const handleExtractGitHub = async (e) => {
    e?.preventDefault();
    if (!githubInput.trim()) return toast.error('Please enter a GitHub username or profile link');

    setSyncingGitHub(true);
    try {
      const res = await api.ai.extractGitHub({ githubUsername: githubInput });
      const data = res.data;

      const updated = {
        ...profileData,
        name: data.name || profileData.name,
        githubUsername: data.githubUsername,
        githubUrl: data.githubUrl,
        bio: data.bio || profileData.bio,
        skills: Array.from(new Set([...(profileData.skills || []), ...(data.skills || [])])),
        hourlyRate: data.hourlyRate || profileData.hourlyRate,
        portfolioProjects: data.portfolioProjects || profileData.portfolioProjects
      };

      setProfileData(updated);
      
      // Auto-save to database
      const saveRes = await api.auth.updateProfile(updated);
      if (updateUser) updateUser(saveRes.data);

      setIsGitHubModalOpen(false);
      toast.success(`🚀 Extracted ${data.portfolioProjects?.length || 0} projects and skills from GitHub @${data.githubUsername}!`);
    } catch (err) {
      toast.error('Failed to sync with GitHub');
    } finally {
      setSyncingGitHub(false);
    }
  };

  // Handle PDF Resume File Selection
  const handlePdfFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('PDF file size must be under 10MB');
    }

    setResumeFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setResumeFileBase64(reader.result);
      toast.success(`📄 Loaded "${file.name}"! Click "Analyze PDF with Gemini" to parse.`);
    };
    reader.readAsDataURL(file);
  };

  // 2. PARSE PDF RESUME FILE OR TEXT
  const handleParseResume = async (e) => {
    e?.preventDefault();

    if (resumeUploadMode === 'pdf') {
      if (!resumeFileBase64) {
        return toast.error('Please select a PDF resume file first');
      }

      setParsingResume(true);
      try {
        const res = await api.ai.parseResumeFile({
          fileBase64: resumeFileBase64,
          mimeType: resumeFile?.type || 'application/pdf',
          fileName: resumeFile?.name || 'resume.pdf'
        });

        await applyParsedResume(res.data, resumeFile?.name);
      } catch (err) {
        toast.error('Failed to parse PDF resume');
      } finally {
        setParsingResume(false);
      }
    } else {
      if (!resumeTextInput.trim()) {
        return toast.error('Please paste resume text');
      }

      setParsingResume(true);
      try {
        const res = await api.ai.parseProfile({ rawText: resumeTextInput });
        await applyParsedResume(res.data, 'Pasted Resume');
      } catch (err) {
        toast.error('Failed to parse resume text');
      } finally {
        setParsingResume(false);
      }
    }
  };

  const applyParsedResume = async (parsed, fileName) => {
    try {
      const normalized = normalizeResumeData(parsed, profileData.bio || '');
      normalized.fileName = fileName || 'Uploaded Resume.pdf';

      const mergedSkills = Array.from(new Set([
        ...(Array.isArray(profileData.skills) ? profileData.skills : []),
        ...(normalized.skills || [])
      ]));

      setResumeData(normalized);

      const updated = {
        ...profileData,
        bio: normalized.summary || profileData.bio,
        skills: mergedSkills,
        hourlyRate: Number(parsed?.hourlyRate) || profileData.hourlyRate || 750,
        resumeData: normalized
      };

      setProfileData(updated);

      try {
        const saveRes = await api.auth.updateProfile(updated);
        if (saveRes?.data) {
          setProfileData(saveRes.data);
          if (saveRes.data.resumeData) {
            setResumeData(normalizeResumeData(saveRes.data.resumeData));
          }
        }
      } catch (saveErr) {
        console.warn('Auto-save profile notice:', saveErr.message);
      }

      setIsResumeModalOpen(false);
      setResumeFile(null);
      setResumeFileBase64('');
      setResumeTextInput('');
      setProfileTab('resume');
      toast.success('🎉 Resume parsed, skills extracted, and populated successfully!');
    } catch (err) {
      console.error('Error applying parsed resume:', err);
      toast.error('Failed to apply parsed resume: ' + err.message);
    }
  };

  // Save Resume Section Edits
  const handleSaveResumeSection = async () => {
    try {
      const mergedSkills = Array.from(new Set([
        ...(Array.isArray(resumeData.skills) ? resumeData.skills : []),
        ...(Array.isArray(profileData.skills) ? profileData.skills : [])
      ]));

      const updated = {
        ...profileData,
        skills: mergedSkills,
        resumeData: {
          ...resumeData,
          skills: mergedSkills
        }
      };

      const res = await api.auth.updateProfile(updated);
      if (updateUser) updateUser(res.data);
      setProfileData(res.data);
      setResumeData(res.data.resumeData || resumeData);
      setIsEditingResume(false);
      toast.success('Resume & skills updated and permanently saved!');
    } catch (err) {
      toast.error('Failed to save resume updates');
    }
  };

  // Add Project Manually
  const handleAddProject = () => {
    const newProj = {
      title: 'New Portfolio Project',
      description: 'Project description and architecture overview...',
      techStack: ['React', 'Node.js'],
      repoUrl: profileData.githubUrl || 'https://github.com',
      liveUrl: '',
      stars: 1
    };
    const updatedProjects = [...(profileData.portfolioProjects || []), newProj];
    setProfileData({ ...profileData, portfolioProjects: updatedProjects });
    setIsEditing(true);
  };

  // Delete Project
  const handleDeleteProject = (index) => {
    const updated = (profileData.portfolioProjects || []).filter((_, i) => i !== index);
    setProfileData({ ...profileData, portfolioProjects: updated });
  };

  // Handle QR upload
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please upload an image file (PNG/JPG)');
    }

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Image size should be under 2MB');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result);
      setProfileData(prev => ({ ...prev, upiQrCode: reader.result }));
      toast.success('QR Code loaded! Click "Save Changes" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrPreview('');
    setProfileData(prev => ({ ...prev, upiQrCode: '' }));
  };

  const handleSave = async () => {
    try {
      const formattedData = {
        ...profileData,
        skills: typeof profileData.skills === 'string' 
          ? profileData.skills.split(',').map(s => s.trim()).filter(Boolean) 
          : profileData.skills,
        upiQrCode: qrPreview || profileData.upiQrCode,
        resumeData
      };
      
      const res = await api.auth.updateProfile(formattedData);
      if (updateUser) updateUser(res.data);
      setProfileData(res.data);
      setQrPreview(res.data.upiQrCode || '');
      toast.success('🎉 Profile, GPay QR & payment details updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleStartSkillQuiz = async (skill) => {
    setQuizSkill(skill);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizModalOpen(true);
    setLoadingQuiz(true);

    try {
      const res = await api.ai.getSkillQuiz(skill);
      setQuizQuestions(res.data?.questions || []);
      setRawQuizQuestions(res.data?.rawQuestions || []);
    } catch (err) {
      toast.error('Failed to generate skill quiz');
      setQuizModalOpen(false);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      return toast.error('Please answer all 3 questions');
    }

    setSubmittingQuiz(true);
    try {
      const answersArray = quizQuestions.map((q, idx) => quizAnswers[idx]);
      const res = await api.ai.verifySkill({
        skill: quizSkill,
        rawQuestions: rawQuizQuestions,
        userAnswers: answersArray
      });

      setQuizResult(res.data);
      if (res.data?.passed) {
        toast.success(`🎉 Congratulations! You earned the Verified AI Expert Badge in ${quizSkill}!`);
        const meRes = await api.auth.getMe();
        if (updateUser) updateUser(meRes.data);
      } else {
        toast.error(`Score: ${res.data?.score}%. You need at least 65% to pass. Try again anytime!`);
      }
    } catch (err) {
      toast.error('Failed to evaluate quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  }

  const isFreelancer = user?.role === 'freelancer';
  const isClient = user?.role === 'client';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Profile Glass Card */}
        <div className="bg-slate-900/90 rounded-3xl overflow-hidden relative border border-slate-800/80 shadow-2xl">
          <div className="h-36 bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 relative">
            {profileData.githubUsername && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 text-white text-xs font-bold flex items-center gap-1.5">
                <FiGithub /> @{profileData.githubUsername}
              </div>
            )}
          </div>
          
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start -mt-14 mb-4 gap-4">
              <div className="w-28 h-28 rounded-3xl bg-slate-800 border-2 border-indigo-500/30 p-1.5 shadow-xl">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-4xl font-black text-white shadow-inner">
                  {profileData.name?.charAt(0).toUpperCase() || 'R'}
                </div>
              </div>

              {!isEditing && (
                <div className="flex flex-wrap items-center gap-2.5 sm:mt-14">
                  {isFreelancer && (
                    <>
                      {/* 1-Click GitHub Extract Button */}
                      <button
                        type="button"
                        onClick={() => setIsGitHubModalOpen(true)}
                        className="px-4 py-2.5 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition flex items-center text-xs shadow-md border border-slate-700 cursor-pointer"
                      >
                        <FiGithub className="w-4 h-4 mr-1.5 text-purple-400" />
                        Extract GitHub Repos & Skills
                      </button>

                      {/* PDF Resume Upload Button */}
                      <button
                        type="button"
                        onClick={() => setIsResumeModalOpen(true)}
                        className="px-4 py-2.5 bg-purple-500/20 text-purple-300 rounded-2xl font-bold hover:bg-purple-500/30 transition flex items-center text-xs border border-purple-500/30 cursor-pointer"
                      >
                        <FiUpload className="w-4 h-4 mr-1.5 text-purple-400" />
                        Upload PDF Resume
                      </button>
                    </>
                  )}

                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 bg-indigo-500/20 text-indigo-300 rounded-2xl font-bold hover:bg-indigo-500/30 transition flex items-center text-xs border border-indigo-500/30 cursor-pointer"
                  >
                    <FiEdit2 className="w-4 h-4 mr-1.5" />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6 max-w-3xl pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Full Name / Display Name</label>
                    <input
                      type="text"
                      value={profileData.name || ''}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Account Role</label>
                    <select
                      value={profileData.role || (isClient ? 'client' : 'freelancer')}
                      onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                      className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl font-bold bg-slate-800 text-white border border-slate-700"
                    >
                      <option value="client">Client (Hire Freelancers)</option>
                      <option value="freelancer">Freelancer (Find Work & Earn)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">GitHub Username (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. rishicloud08"
                      value={profileData.githubUsername || ''}
                      onChange={(e) => setProfileData({...profileData, githubUsername: e.target.value, githubUrl: `https://github.com/${e.target.value}`})}
                      className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl"
                    />
                  </div>
                </div>

                {isFreelancer && (
                  <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      ⭐ Self-Assessed Experience Level:
                    </label>
                    <p className="text-[11px] text-amber-400/80 mb-2">
                      Click yellow stars to update your experience tier
                    </p>
                    <StarRating
                      value={profileData.rating || 5}
                      onChange={(stars) => setProfileData({ ...profileData, rating: stars })}
                      size="lg"
                      showLabel={true}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {profileData.role === 'client' ? 'Client / Company Summary & Bio' : 'Professional Summary & Bio'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={profileData.role === 'client' ? 'Describe your organization, projects, or hiring requirements...' : 'Describe your engineering experience, skills, and background...'}
                    value={profileData.bio || ''}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl"
                  />
                </div>

                {isFreelancer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Skills (comma separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(profileData.skills) ? profileData.skills.join(', ') : (profileData.skills || '')}
                        onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                        className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Hourly Rate in Rupees (₹/hr)</label>
                      <input
                        type="number"
                        placeholder="e.g. 750"
                        value={profileData.hourlyRate || ''}
                        onChange={(e) => setProfileData({...profileData, hourlyRate: e.target.value})}
                        className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Google Pay / UPI Connection Setup (For both Client and Freelancer) */}
                <div className="bg-gradient-to-br from-emerald-950/60 to-teal-950/60 p-5 rounded-2xl border border-emerald-500/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white p-1.5 rounded-lg text-xs font-bold">
                      <FiSmartphone />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">
                        {profileData.role === 'client' ? "Client Google Pay & UPI Connected Account" : "Freelancer Google Pay & UPI Details"}
                      </h4>
                      <p className="text-[11px] text-emerald-400/80">
                        {profileData.role === 'client' 
                          ? "Connect your Google Pay mobile & UPI ID for 1-click direct billing and transaction receipts."
                          : "Clients will scan your uploaded GPay QR code to send direct payments straight to your bank account."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-300 mb-1">
                        Google Pay Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9840827712"
                        value={profileData.gpayNumber || ''}
                        onChange={(e) => setProfileData({...profileData, gpayNumber: e.target.value})}
                        className="w-full px-3 py-2 text-xs border border-emerald-500/30 rounded-xl bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-300 mb-1">
                        UPI ID (VPA)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@okaxis"
                        value={profileData.upiId || ''}
                        onChange={(e) => setProfileData({...profileData, upiId: e.target.value})}
                        className="w-full px-3 py-2 text-xs border border-emerald-500/30 rounded-xl bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
                      />
                    </div>
                  </div>

                  {isFreelancer && (
                    <div>
                      <label className="block text-xs font-bold text-emerald-300 mb-2">
                        Upload GPay / PhonePe / Paytm QR Code Image
                      </label>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-300 border-2 border-dashed border-emerald-500/40 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                          <FiUpload className="text-base" />
                          <span>Select QR Code Image (PNG/JPG)</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleQrUpload} 
                          />
                        </label>

                        {qrPreview && (
                          <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl border border-emerald-500/30">
                            <img 
                              src={qrPreview} 
                              alt="Freelancer GPay QR" 
                              className="w-14 h-14 object-contain rounded-lg bg-white p-1" 
                            />
                            <div>
                              <span className="text-[11px] font-bold text-emerald-400 block">✓ QR Code Active</span>
                              <button
                                type="button"
                                onClick={handleRemoveQr}
                                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold mt-1 cursor-pointer"
                              >
                                <FiTrash2 /> Remove QR
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-3">
                  <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 shadow-md cursor-pointer">
                    Save Changes
                  </button>
                  <button onClick={() => { setIsEditing(false); setProfileData(user); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white">{profileData.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isFreelancer ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {profileData.role}
                  </span>
                  {profileData.githubUsername && (
                    <a 
                      href={`https://github.com/${profileData.githubUsername}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-indigo-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700"
                    >
                      <FiGithub /> github.com/{profileData.githubUsername} <FiExternalLink className="text-[10px]" />
                    </a>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-5 text-slate-400 mb-6 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5"><FiMail className="text-indigo-400" /> {profileData.email}</div>
                  
                  {isFreelancer && profileData.hourlyRate && (
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="text-emerald-400 font-black">₹</span> {profileData.hourlyRate}/hr
                    </div>
                  )}

                  {/* Yellow Star Rating View */}
                  {isFreelancer && (
                    <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                      <span className="text-xs font-semibold text-amber-300">Experience Tier:</span>
                      <StarRating value={profileData.rating || 5} readOnly size="sm" showLabel />
                    </div>
                  )}
                </div>

                <div className="prose max-w-none text-slate-300 text-xs md:text-sm leading-relaxed mb-6 glass-dark p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {isClient ? "Client / Company Summary & Bio" : "Professional Summary"}
                  </h3>
                  <p>{profileData.bio || (isClient ? "Verified Client on FreelanceHub hiring top technical talent." : "Full-stack software engineer specializing in scalable systems and reactive frontends.")}</p>
                </div>

                {/* Verified AI Expert Badges */}
                {isFreelancer && Array.isArray(profileData.verifiedBadges) && profileData.verifiedBadges.length > 0 && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 rounded-2xl border border-amber-500/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
                      <FiAward className="text-yellow-400" /> Verified AI Expert Credentials
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {(Array.isArray(profileData.verifiedBadges) ? profileData.verifiedBadges : []).map((badge, idx) => (
                        <div key={idx} className="bg-slate-800 px-3.5 py-2 rounded-xl border border-amber-500/30 flex items-center gap-2 shadow-xs">
                          <span className="text-base">🌟</span>
                          <div>
                            <p className="text-xs font-black text-white">{badge.skill}</p>
                            <p className="text-[10px] text-amber-300 font-semibold">{badge.title} • Score: {badge.score}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills & Take AI Skill Quiz */}
                {isFreelancer && Array.isArray(profileData.skills) && profileData.skills.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Skills & Tech Stack</h3>
                      <span className="text-[11px] text-indigo-400 font-semibold">Click any skill to verify with AI Quiz ⚡</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(profileData.skills) ? profileData.skills : []).map((skill, index) => {
                        const isVerified = Array.isArray(profileData.verifiedBadges) && profileData.verifiedBadges.some(b => b.skill.toLowerCase() === skill.toLowerCase());
                        return (
                          <button 
                            key={index} 
                            type="button"
                            onClick={() => handleStartSkillQuiz(skill)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isVerified 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30' 
                                : 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700 hover:border-indigo-500/40'
                            }`}
                          >
                            <span>{skill}</span>
                            {isVerified ? <span className="text-[10px]">⭐ Verified</span> : <span className="text-[10px] text-indigo-400 font-normal">Take Quiz</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Connected Google Pay & UPI Showcase Card (For both Client and Freelancer) */}
                <div className="mb-6 p-5 bg-gradient-to-br from-emerald-950/60 to-teal-950/60 rounded-2xl border border-emerald-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-600 text-white p-1 rounded-md text-xs font-bold">
                          <FiSmartphone />
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                          {isClient ? "Client Google Pay & UPI Connected Account" : "Freelancer Google Pay & UPI Details"}
                        </h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          (profileData.gpayNumber || profileData.upiId) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {(profileData.gpayNumber || profileData.upiId) ? '✓ Connected' : 'Not Connected'}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-xs space-y-1 text-emerald-200">
                        <p>Linked GPay Number: <strong className="font-mono">{profileData.gpayNumber || (isClient ? 'Not linked (Click Edit Profile to add)' : 'Not set')}</strong></p>
                        <p>Linked UPI ID: <strong className="font-mono">{profileData.upiId || (isClient ? 'Not linked' : 'Not set')}</strong></p>
                      </div>
                    </div>

                    {profileData.upiQrCode ? (
                      <div className="bg-slate-800 p-2.5 rounded-xl border border-emerald-500/30 text-center">
                        <img src={profileData.upiQrCode} alt="GPay QR Code" className="w-20 h-20 object-contain mx-auto rounded-md bg-white p-1" />
                        <span className="text-[10px] font-bold text-emerald-400 block mt-1">✓ Active GPay QR</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-dashed border-emerald-500/30 text-center">
                        <p className="font-medium text-emerald-300">
                          {(profileData.gpayNumber || profileData.upiId) ? 'Linked via UPI / Mobile' : 'No GPay Account Linked'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(profileData.gpayNumber || profileData.upiId) ? 'Ready for Instant Direct Google Pay Transfers' : 'Click Edit Profile to connect'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PROFILE SUB-SECTION TABS: Projects | Editable Resume | Reviews */}
        {isFreelancer && (
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 flex gap-2 overflow-x-auto shadow-lg">
            <button
              type="button"
              onClick={() => setProfileTab('projects')}
              className={`py-3 px-4 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                profileTab === 'projects' || profileTab === 'overview'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-400 text-indigo-200 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <FiFolder className="text-base text-indigo-400" /> Extracted GitHub & Portfolio Projects ({(Array.isArray(profileData.portfolioProjects) ? profileData.portfolioProjects : []).length})
            </button>

            <button
              type="button"
              onClick={() => setProfileTab('resume')}
              className={`py-3 px-4 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                profileTab === 'resume'
                  ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-400 text-purple-200 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <FiFileText className="text-base text-purple-400" /> Editable Resume & Experience Profile
            </button>

            <button
              type="button"
              onClick={() => setProfileTab('reviews')}
              className={`py-3 px-4 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                profileTab === 'reviews'
                  ? 'bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border border-amber-400 text-amber-200 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <FiAward className="text-base text-amber-400" /> Reviews ({(Array.isArray(reviews) ? reviews : []).length})
            </button>
          </div>
        )}

        {/* SECTION 1: EXTRACTED GITHUB & PORTFOLIO PROJECTS */}
        {(profileTab === 'projects' || profileTab === 'overview') && isFreelancer && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FiGithub className="text-purple-400" /> Extracted GitHub & Portfolio Projects
                </h3>
                <p className="text-xs text-slate-400">Live projects synced from @{profileData.githubUsername || 'rishicloud08'} with tech stacks and links.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGitHubModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <FiZap className="text-yellow-400" /> Sync GitHub Repos
                </button>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1 border border-indigo-500/30 cursor-pointer"
                >
                  <FiPlus /> Add Project
                </button>
              </div>
            </div>

            {(!Array.isArray(profileData.portfolioProjects) || profileData.portfolioProjects.length === 0) ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 space-y-3">
                <FiGithub className="w-12 h-12 mx-auto text-slate-500 opacity-60" />
                <h4 className="text-sm font-bold text-slate-200">No Projects Synced Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click "Extract GitHub Repos & Skills" above to automatically pull your repositories.
                </p>
                <button
                  type="button"
                  onClick={() => setIsGitHubModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Sync GitHub @{profileData.githubUsername || 'rishicloud08'} Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Array.isArray(profileData.portfolioProjects) ? profileData.portfolioProjects : []).map((proj, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                          {proj.title}
                        </h4>
                        {proj.stars > 0 && (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-0.5">
                            ★ {proj.stars}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                        {proj.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(Array.isArray(proj.techStack) ? proj.techStack : []).map((t, ti) => (
                          <span key={ti} className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/60 text-xs">
                      <div className="flex items-center gap-3">
                        {proj.repoUrl && (
                          <a 
                            href={proj.repoUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-slate-300 hover:text-indigo-400 font-bold flex items-center gap-1"
                          >
                            <FiGithub /> Source Code
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a 
                            href={proj.liveUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                          >
                            <FiExternalLink /> Live Demo
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(idx)}
                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: DEDICATED EDITABLE RESUME & EXPERIENCE */}
        {profileTab === 'resume' && isFreelancer && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiFileText className="text-purple-400" /> Editable Resume & Experience Profile
                  </h3>
                  {resumeData.fileName && (
                    <span className="bg-purple-500/20 text-purple-300 text-[11px] font-bold px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                      <FiFile /> {resumeData.fileName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Upload PDF resumes or edit and customize your work experience, education, and certifications anytime.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FiUpload /> Upload PDF Resume
                </button>

                {!isEditingResume ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingResume(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <FiEdit2 /> Edit Resume Fields
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveResumeSection}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <FiCheck /> Save Resume
                  </button>
                )}
              </div>
            </div>

            {/* Resume Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FiBriefcase className="text-indigo-400" /> Career Summary
              </h4>
              {isEditingResume ? (
                <textarea
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  value={resumeData.summary || ''}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                />
              ) : (
                <p className="text-xs md:text-sm text-slate-300 bg-slate-800/70 p-4 rounded-2xl border border-slate-700/70 leading-relaxed">
                  {resumeData.summary || profileData.bio || "No summary provided. Upload a resume or click Edit Resume Fields to add your career summary."}
                </p>
              )}
            </div>

            {/* Work Experience */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FiBriefcase className="text-indigo-400" /> Work Experience
                </h4>
                {isEditingResume && (
                  <button
                    type="button"
                    onClick={() => setResumeData({
                      ...resumeData,
                      experience: [...(Array.isArray(resumeData.experience) ? resumeData.experience : []), { role: 'Software Engineer', company: 'Company Name', duration: '2023 - Present', description: 'Engineered web applications...' }]
                    })}
                    className="text-[11px] text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    + Add Experience
                  </button>
                )}
              </div>

              {(!Array.isArray(resumeData.experience) || resumeData.experience.length === 0) ? (
                <p className="text-xs text-slate-500 italic">No work experience entries added.</p>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(resumeData.experience) ? resumeData.experience : []).map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 shadow-xs">
                      {isEditingResume ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Role"
                              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                              value={exp.role || ''}
                              onChange={(e) => {
                                const newExp = [...(Array.isArray(resumeData.experience) ? resumeData.experience : [])];
                                newExp[idx] = { ...newExp[idx], role: e.target.value };
                                setResumeData({ ...resumeData, experience: newExp });
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Company"
                              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                              value={exp.company || ''}
                              onChange={(e) => {
                                const newExp = [...(Array.isArray(resumeData.experience) ? resumeData.experience : [])];
                                newExp[idx] = { ...newExp[idx], company: e.target.value };
                                setResumeData({ ...resumeData, experience: newExp });
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Duration"
                              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                              value={exp.duration || ''}
                              onChange={(e) => {
                                const newExp = [...(Array.isArray(resumeData.experience) ? resumeData.experience : [])];
                                newExp[idx] = { ...newExp[idx], duration: e.target.value };
                                setResumeData({ ...resumeData, experience: newExp });
                              }}
                            />
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Description"
                            className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                            value={exp.description || ''}
                            onChange={(e) => {
                              const newExp = [...(Array.isArray(resumeData.experience) ? resumeData.experience : [])];
                              newExp[idx] = { ...newExp[idx], description: e.target.value };
                              setResumeData({ ...resumeData, experience: newExp });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newExp = (Array.isArray(resumeData.experience) ? resumeData.experience : []).filter((_, i) => i !== idx);
                              setResumeData({ ...resumeData, experience: newExp });
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                          >
                            Remove Entry
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-xs text-white">
                              {typeof exp.role === 'string' ? exp.role : (exp.role?.title || String(exp.role || 'Software Engineer'))} • <span className="text-indigo-400">{typeof exp.company === 'string' ? exp.company : (exp.company?.name || String(exp.company || 'Company'))}</span>
                            </h5>
                            <span className="text-[11px] text-slate-400 font-semibold">{typeof exp.duration === 'string' || typeof exp.duration === 'number' ? exp.duration : String(exp.duration || '')}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {typeof exp.description === 'string' 
                              ? exp.description 
                              : (Array.isArray(exp.description) 
                                  ? exp.description.map(d => typeof d === 'string' ? d : JSON.stringify(d)).join(' • ') 
                                  : String(exp.description || ''))}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FiBookOpen className="text-indigo-400" /> Education
                </h4>
                {isEditingResume && (
                  <button
                    type="button"
                    onClick={() => setResumeData({
                      ...resumeData,
                      education: [...(Array.isArray(resumeData.education) ? resumeData.education : []), { institution: 'University', degree: 'Degree', year: '2020 - 2024' }]
                    })}
                    className="text-[11px] text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    + Add Education
                  </button>
                )}
              </div>

              {(!Array.isArray(resumeData.education) || resumeData.education.length === 0) ? (
                <p className="text-xs text-slate-500 italic">No education entries added.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Array.isArray(resumeData.education) ? resumeData.education : []).map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1 shadow-xs">
                      {isEditingResume ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Degree"
                            className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                            value={edu.degree || ''}
                            onChange={(e) => {
                              const newEdu = [...(Array.isArray(resumeData.education) ? resumeData.education : [])];
                              newEdu[idx] = { ...newEdu[idx], degree: e.target.value };
                              setResumeData({ ...resumeData, education: newEdu });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Institution"
                            className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const newEdu = [...(Array.isArray(resumeData.education) ? resumeData.education : [])];
                              newEdu[idx] = { ...newEdu[idx], institution: e.target.value };
                              setResumeData({ ...resumeData, education: newEdu });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Year"
                            className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                            value={edu.year || ''}
                            onChange={(e) => {
                              const newEdu = [...(Array.isArray(resumeData.education) ? resumeData.education : [])];
                              newEdu[idx] = { ...newEdu[idx], year: e.target.value };
                              setResumeData({ ...resumeData, education: newEdu });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newEdu = (Array.isArray(resumeData.education) ? resumeData.education : []).filter((_, i) => i !== idx);
                              setResumeData({ ...resumeData, education: newEdu });
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                          >
                            Remove Entry
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h5 className="font-bold text-xs text-white">
                            {typeof edu.degree === 'string' ? edu.degree : (edu.degree?.name || String(edu.degree || ''))}
                          </h5>
                          <p className="text-xs text-indigo-400 font-medium">
                            {typeof edu.institution === 'string' ? edu.institution : (edu.institution?.name || String(edu.institution || ''))}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {typeof edu.year === 'string' || typeof edu.year === 'number' ? edu.year : String(edu.year || '')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Resume Skills & Core Competencies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FiCode className="text-indigo-400" /> Extracted Resume Skills & Core Competencies ({((Array.isArray(resumeData.skills) && resumeData.skills.length > 0 ? resumeData.skills : (Array.isArray(profileData.skills) ? profileData.skills : [])) || []).length})
                </h4>
                {isEditingResume && (
                  <span className="text-[11px] text-slate-400">Edit skills separated by commas below</span>
                )}
              </div>

              {isEditingResume ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Python, MongoDB, Tailwind CSS"
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                    value={Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : (Array.isArray(profileData.skills) ? profileData.skills.join(', ') : '')}
                    onChange={(e) => {
                      const skillArr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setResumeData({ ...resumeData, skills: skillArr });
                      setProfileData({ ...profileData, skills: skillArr });
                    }}
                  />
                  <p className="text-[10px] text-slate-400">These skills are synced with your primary freelancer profile and visible to all clients.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {((Array.isArray(resumeData.skills) && resumeData.skills.length > 0 ? resumeData.skills : (Array.isArray(profileData.skills) ? profileData.skills : [])) || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No skills extracted yet. Upload a resume to automatically extract skills.</p>
                  ) : (
                    ((Array.isArray(resumeData.skills) && resumeData.skills.length > 0 ? resumeData.skills : (Array.isArray(profileData.skills) ? profileData.skills : [])) || []).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <FiCheck className="text-indigo-400 text-[10px]" /> {typeof skill === 'string' ? skill : (skill?.name || skill?.skill || String(skill || ''))}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Certifications & Accreditations
              </h4>
              {isEditingResume ? (
                <input
                  type="text"
                  placeholder="e.g. AWS Certified Practitioner, Google Cloud Architect (comma-separated)"
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  value={Array.isArray(resumeData.certifications) ? resumeData.certifications.join(', ') : ''}
                  onChange={(e) => {
                    const certArr = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                    setResumeData({ ...resumeData, certifications: certArr });
                  }}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(resumeData.certifications) ? resumeData.certifications : []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No certifications listed.</p>
                  ) : (
                    (Array.isArray(resumeData.certifications) ? resumeData.certifications : []).map((cert, idx) => (
                      <span key={idx} className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        📜 {typeof cert === 'string' ? cert : (cert?.name || cert?.title || String(cert || ''))}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: REVIEWS */}
        {(profileTab === 'reviews' || !isFreelancer) && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 text-white shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FiAward className="text-yellow-400" /> Client Reviews & Feedback ({(Array.isArray(reviews) ? reviews : []).length})
            </h2>
            
            {(Array.isArray(reviews) ? reviews : []).length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <FiStar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No verified project reviews yet. Complete your first milestone to receive a rating!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(Array.isArray(reviews) ? reviews : []).map((review) => (
                  <div key={review._id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-white">{review.reviewer?.name || 'Verified Client'}</span>
                      <StarRating value={review.rating} readOnly size="sm" />
                    </div>
                    <p className="text-xs text-slate-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: GITHUB PROFILE & REPOSITORIES EXTRACTOR */}
        {isGitHubModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-md w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 relative border-b border-white/10">
                <button
                  onClick={() => setIsGitHubModalOpen(false)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                    <FiGithub /> GitHub Profile Extractor
                  </span>
                </div>
                <h3 className="text-xl font-black mt-2 text-white">
                  Sync GitHub Repos & Skills
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Extracts your repositories, languages, tech stack, and portfolio projects from GitHub.
                </p>
              </div>

              <form onSubmit={handleExtractGitHub} className="p-6 bg-slate-900/70 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    GitHub Username or Profile URL
                  </label>
                  <div className="relative">
                    <FiGithub className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. rishicloud08"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-white font-mono"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Example: <strong>rishicloud08</strong> (or https://github.com/rishicloud08)
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={syncingGitHub}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {syncingGitHub ? 'Extracting Repositories with Gemini...' : '🚀 Extract Repositories & Skills →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: RESUME PDF UPLOAD & PARSER */}
        {isResumeModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-lg w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 p-6 relative border-b border-white/10">
                <button
                  onClick={() => setIsResumeModalOpen(false)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                    <FiFileText /> AI PDF Resume Extractor
                  </span>
                </div>
                <h3 className="text-xl font-black mt-2 text-white">
                  Upload PDF Resume
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Upload your PDF resume file. Gemini 2.0 Multimodal AI will extract your experience, education, skills, and certifications into your editable resume section.
                </p>
              </div>

              {/* Mode Toggle: Document File Upload vs Text */}
              <div className="flex border-b border-white/10 bg-white/5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setResumeUploadMode('pdf')}
                  className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                    resumeUploadMode === 'pdf' ? 'bg-purple-600/40 text-white border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📄 Upload PDF / Word (.docx)
                </button>
                <button
                  type="button"
                  onClick={() => setResumeUploadMode('text')}
                  className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                    resumeUploadMode === 'text' ? 'bg-purple-600/40 text-white border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📝 Paste Resume Text
                </button>
              </div>

              <form onSubmit={handleParseResume} className="p-6 bg-slate-900/70 space-y-4">
                {resumeUploadMode === 'pdf' ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-300">
                      Select Word (.docx/.doc) or PDF Resume File
                    </label>

                    <label className="border-2 border-dashed border-purple-400/40 hover:border-purple-400/80 bg-white/5 hover:bg-white/10 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                      <FiUpload className="w-10 h-10 text-purple-400 mb-2" />
                      <span className="text-xs font-bold text-white">Click or drag & drop Word or PDF Resume</span>
                      <span className="text-[10px] text-gray-400 mt-1">Supports .docx, .doc, .pdf documents up to 10MB</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handlePdfFileChange}
                      />
                    </label>

                    {resumeFile && (
                      <div className="flex items-center justify-between p-3 bg-purple-950/50 rounded-xl border border-purple-500/30 text-xs text-purple-200">
                        <div className="flex items-center gap-2 truncate">
                          <FiFile className="text-purple-400 flex-shrink-0 text-base" />
                          <span className="font-bold truncate">{resumeFile.name}</span>
                          <span className="text-[10px] text-gray-400">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <span className="text-emerald-400 font-bold text-xs">✓ Ready to Analyze</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Paste Resume Content / Work History
                    </label>
                    <textarea
                      rows={6}
                      placeholder="e.g. Rishi kesh.V - Full-Stack Developer with expertise in React, Node.js, Python. Education: B.Tech in Computer Science. Experience at Tech Labs building cloud web apps..."
                      className="w-full p-3 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-white font-sans"
                      value={resumeTextInput}
                      onChange={(e) => setResumeTextInput(e.target.value)}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={parsingResume || (resumeUploadMode === 'pdf' && !resumeFileBase64)}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {parsingResume ? 'Extracting Resume with Gemini AI...' : '✨ Analyze Document & Populate Resume →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: AI SKILL ASSESSMENT QUIZ */}
        {quizModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-lg w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 p-6 relative border-b border-white/10">
                <button
                  onClick={() => setQuizModalOpen(false)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                    <FiZap /> Gemini AI Skill Certification
                  </span>
                </div>
                <h3 className="text-xl font-black mt-2 text-white">
                  Skill Assessment: {quizSkill}
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Answer 3 technical questions generated by AI. Score $\ge 65\%$ to earn the <strong>Verified AI Expert</strong> badge!
                </p>
              </div>

              {loadingQuiz ? (
                <div className="p-12 text-center">
                  <LoadingSpinner />
                  <p className="text-xs text-purple-200 mt-3 font-semibold">Gemini is tailoring technical questions for {quizSkill}...</p>
                </div>
              ) : quizResult ? (
                <div className="p-8 text-center space-y-4 bg-slate-900/70">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-md ${
                    quizResult.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40' : 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                  }`}>
                    {quizResult.passed ? '🌟' : '📝'}
                  </div>

                  <h4 className="text-xl font-black text-white">
                    {quizResult.passed ? `Verified AI Expert in ${quizSkill}!` : `Quiz Completed: ${quizResult.score}%`}
                  </h4>

                  <p className="text-xs text-gray-300 max-w-sm mx-auto">
                    {quizResult.passed
                      ? `Your verified expert badge is now active and highlighted on your proposals for clients to see.`
                      : `You answered ${quizResult.correctCount} of ${quizResult.totalQuestions} correctly. Review your knowledge and try again whenever you are ready!`}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => setQuizModalOpen(false)}
                      className="bg-white text-indigo-950 font-bold px-6 py-2.5 rounded-2xl text-xs shadow-md hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Close & Return to Profile
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuiz} className="p-6 bg-slate-900/70 space-y-5">
                  {quizQuestions.map((q, qIndex) => (
                    <div key={q.id || qIndex} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2.5">
                      <p className="text-xs font-bold text-white leading-relaxed">
                        {qIndex + 1}. {q.question}
                      </p>

                      <div className="space-y-1.5">
                        {q.options.map((option, optIdx) => (
                          <label 
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                              quizAnswers[qIndex] === optIdx
                                ? 'bg-indigo-600/40 border-indigo-400 text-white font-semibold'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              checked={quizAnswers[qIndex] === optIdx}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [qIndex]: optIdx })}
                              className="text-indigo-600 focus:ring-0"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingQuiz}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submittingQuiz ? 'Evaluating Answers...' : 'Submit Assessment & Earn Badge →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}