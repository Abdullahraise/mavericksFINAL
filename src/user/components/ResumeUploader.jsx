import { useState, useEffect } from "react";
import SkillAssessment from "./SkillAssessment";
import ProgressStepper from "./ProgressStepper";
import VideoRecommendations from "./VideoRecommendations";
import SkillProgressTracker from "./SkillProgressTracker";
import { uploadResume, updateUserProfile } from "../../firebaseConfig";

export default function ResumeUploader({ onResumeUpload }) {
  const [files, setFiles] = useState([]);
  const [profiles, setProfiles] = useState(() => {
    const savedProfiles = localStorage.getItem("resumeProfiles");
    return savedProfiles ? JSON.parse(savedProfiles) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState(() => {
    return localStorage.getItem("resumeUploaded") === "true";
  });
  const [skillsExtracted, setSkillsExtracted] = useState(() => {
    return localStorage.getItem("skillsExtracted") === "true";
  });
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [weakSkills, setWeakSkills] = useState(() => {
    const savedWeakSkills = localStorage.getItem("weakSkills");
    return savedWeakSkills ? JSON.parse(savedWeakSkills) : [];
  });
  const [completedVideos, setCompletedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("resumeActiveTab");
    return savedTab || "resume"; // resume, assessment, videos, progress
  });

  const progressSteps = [
    { label: "Resume Upload", completed: resumeUploaded },
    { label: "Skills Extraction", completed: skillsExtracted },
    { label: "Skill Assessment", completed: assessmentResults.length > 0 },
    { label: "Video Learning", completed: completedVideos.length > 0 }
  ];
  
  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedAssessments = localStorage.getItem("assessmentResults");
    if (savedAssessments) {
      setAssessmentResults(JSON.parse(savedAssessments));
    }
    
    const savedVideos = localStorage.getItem("completedVideos");
    if (savedVideos) {
      setCompletedVideos(JSON.parse(savedVideos));
    }
    
    // If there's a profile with skills, update the profiles state
    const userProfile = localStorage.getItem("userProfile");
    if (userProfile) {
      const parsedProfile = JSON.parse(userProfile);
      if (parsedProfile.skills && parsedProfile.skills.length > 0) {
        setProfiles([{
          filename: "Saved Profile",
          skills: parsedProfile.skills
        }]);
        setSkillsExtracted(true);
        setResumeUploaded(true);
      }
    }
  }, []);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
    setError("");
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files first!");
      return;
    }
    setLoading(true);
    setResumeUploaded(true);

    try {
      const uploadedProfiles = [];

      for (const file of files) {
        // Upload resume to storage if needed
        try {
          await uploadResume(file);
        } catch (err) {
          console.log("Resume upload to storage skipped or failed:", err);
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("http://127.0.0.1:8002/analyze_resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        let skills = [];
        if (Array.isArray(data.skills)) {
          skills = data.skills;
        }

        uploadedProfiles.push({
          filename: data.filename || file.name,
          skills,
        });
      }

      setProfiles(uploadedProfiles);
      setSkillsExtracted(true);

      if (uploadedProfiles.length > 0) {
        const allSkills = uploadedProfiles.flatMap(profile => profile.skills);
        const uniqueSkills = [...new Set(allSkills)];

        try {
          updateUserProfile({
            skills: uniqueSkills,
            resumeUploaded: true,
            skillsExtracted: true
          });
        } catch (err) {
          console.log("User profile update skipped or failed:", err);
        }
        
        // Call the onResumeUpload callback with the file data
        if (onResumeUpload) {
          onResumeUpload({
            skills: uniqueSkills,
            filename: uploadedProfiles[0].filename
          });
        }
      }
    } catch (err) {
      setError("Upload failed, check console");
      console.error("Error uploading resume:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save state to localStorage when it changes
  useEffect(() => {
    if (assessmentResults.length > 0) {
      localStorage.setItem("assessmentResults", JSON.stringify(assessmentResults));
    }
  }, [assessmentResults]);

  useEffect(() => {
    if (completedVideos.length > 0) {
      localStorage.setItem("completedVideos", JSON.stringify(completedVideos));
    }
  }, [completedVideos]);
  
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem("resumeProfiles", JSON.stringify(profiles));
    }
  }, [profiles]);
  
  useEffect(() => {
    localStorage.setItem("resumeUploaded", resumeUploaded);
  }, [resumeUploaded]);
  
  useEffect(() => {
    localStorage.setItem("skillsExtracted", skillsExtracted);
  }, [skillsExtracted]);
  
  useEffect(() => {
    if (weakSkills.length > 0) {
      localStorage.setItem("weakSkills", JSON.stringify(weakSkills));
    }
  }, [weakSkills]);
  
  useEffect(() => {
    localStorage.setItem("resumeActiveTab", activeTab);
  }, [activeTab]);

  const handleAssessmentComplete = (result) => {
    const newResult = {
      ...result,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    setAssessmentResults(prev => {
      // Replace existing result for same skill or add new one
      const filtered = prev.filter(r => r.skill !== result.skill);
      return [...filtered, newResult];
    });

    // Extract weak skills for video recommendations
    if (result.score < 40) {
      // If score is below 40%, add the skill to weak skills list
      console.log("Score below 40% detected:", result.skill, result.score);
      setWeakSkills(prev => {
        const newWeakSkills = [...prev];
        if (!newWeakSkills.includes(result.skill)) {
          newWeakSkills.push(result.skill);
          console.log("Added to weak skills:", result.skill);
        }
        return newWeakSkills;
      });
    }

    setShowAssessment(false);
    setCurrentAssessment(null);
    setActiveTab("videos"); // Automatically switch to videos tab after assessment
  };

  const handleStartAssessment = (skill) => {
    setCurrentAssessment(skill);
    setShowAssessment(true);
  };

  const handleRetakeAssessment = (skill) => {
    handleStartAssessment(skill);
  };

  const handleVideoComplete = (video) => {
    setCompletedVideos(prev => {
      const exists = prev.find(v => v.id === video.id);
      if (!exists) {
        return [...prev, { ...video, completedAt: new Date().toISOString() }];
      }
      return prev;
    });
  };

  const getCurrentStep = () => {
    if (!resumeUploaded) return 0;
    if (!skillsExtracted) return 1;
    if (assessmentResults.length === 0) return 2;
    if (completedVideos.length === 0) return 3;
    return 4;
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("resume")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "resume"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📄 Resume Upload
          </button>
          <button
            onClick={() => setActiveTab("assessment")}
            disabled={!skillsExtracted}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${!skillsExtracted ? "text-gray-400 cursor-not-allowed" : 
              activeTab === "assessment"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📝 Skill Assessment
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            disabled={weakSkills.length === 0}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${weakSkills.length === 0 ? "text-gray-400 cursor-not-allowed" :
              activeTab === "videos"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📚 Video Learning
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            disabled={assessmentResults.length === 0}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${assessmentResults.length === 0 ? "text-gray-400 cursor-not-allowed" :
              activeTab === "progress"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📊 Progress Tracker
          </button>
        </nav>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={getCurrentStep()} steps={progressSteps} />

      {/* Resume Upload Tab */}
      {activeTab === "resume" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Upload Resume and Extract Skills</h2>
          
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            className="mb-4"
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Uploading..." : "Upload and Extract Skills"}
          </button>

          {error && <p className="text-red-500 mt-2">{error}</p>}

          {profiles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Extracted Skills:</h3>
              {profiles.map((profile, idx) => (
                <div key={idx} className="mb-4">
                  <p className="font-medium">{profile.filename}</p>
                  <ul className="list-disc ml-6">
                    {profile.skills.map((skill, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{skill}</span>
                        <button 
                          onClick={() => {
                            handleStartAssessment(skill);
                            setActiveTab("assessment");
                          }}
                          className="ml-4 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Assess
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {skillsExtracted && (
                <button
                  onClick={() => setActiveTab("assessment")}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Continue to Skill Assessment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skill Assessment Tab */}
      {activeTab === "assessment" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Skill Assessment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.flatMap(profile => profile.skills).map((skill) => {
              const existingResult = assessmentResults.find(r => r.skill === skill);
              const isCompleted = !!existingResult;
              const score = existingResult?.score || 0;

              return (
                <div
                  key={skill}
                  className={`border rounded-lg p-6 transition-all duration-200 ${
                    isCompleted
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">{skill}</h4>
                    {isCompleted && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {score}%
                      </span>
                    )}
                  </div>

                  {isCompleted ? (
                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRetakeAssessment(skill)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Retake
                        </button>
                        <button
                          onClick={() => setActiveTab("progress")}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartAssessment(skill)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                    >
                      Start Assessment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {assessmentResults.length > 0 && weakSkills.length > 0 && (
            <button
              onClick={() => setActiveTab("videos")}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Continue to Video Learning
            </button>
          )}
        </div>
      )}

      {/* Video Learning Tab */}
      {activeTab === "videos" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Video Learning for Weak Skills</h2>
          <VideoRecommendations
            weakSkills={weakSkills}
            onVideoComplete={handleVideoComplete}
          />
          
          {completedVideos.length > 0 && (
            <button
              onClick={() => setActiveTab("progress")}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Progress Tracker
            </button>
          )}
        </div>
      )}

      {/* Progress Tracker Tab */}
      {activeTab === "progress" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Skill Progress Tracker</h2>
          <SkillProgressTracker
            assessmentResults={assessmentResults}
            onRetakeAssessment={(skill) => {
              handleRetakeAssessment(skill);
              setActiveTab("assessment");
            }}
          />
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessment && currentAssessment && (
        <SkillAssessment
          skill={currentAssessment}
          onComplete={handleAssessmentComplete}
          onClose={() => {
            setShowAssessment(false);
            setCurrentAssessment(null);
          }}
        />
      )}
    </div>
  );
}
