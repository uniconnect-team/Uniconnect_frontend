import { useEffect, useState } from "react";
import { Icon } from "../../../components/Icon";
import { useNavigate } from "react-router-dom";
import { BottomMenu } from "../../../components/BottomMenu";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import type { RoommateProfile, RoommateMatch, RoommateRequest } from "../../../lib/types";
import {
  getRoommateProfile,
  createOrUpdateRoommateProfile,
  getRoommateMatches,
  refreshRoommateMatches,
  toggleMatchFavorite,
  getRoommateRequests,
  sendRoommateRequest,
  acceptRoommateRequest,
  declineRoommateRequest,
} from "../../../lib/api";

// Helper function to format enum values nicely
function formatEnumValue(value: string): string {
  return value
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function Roommate() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "matches" | "requests">("profile");
  
  // Profile state
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<RoommateProfile>>({});
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  
  // Matches state
  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(50);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  
  // Requests state
  const [requests, setRequests] = useState<RoommateRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<"sent" | "received" | "all">("all");
  const [selectedMatch, setSelectedMatch] = useState<RoommateMatch | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Load matches when tab changes
  useEffect(() => {
    if (activeTab === "matches") {
      loadMatches();
    }
  }, [activeTab, minScore, favoritesOnly]);

  // Load requests when tab changes
  useEffect(() => {
    if (activeTab === "requests") {
      loadRequests();
    }
  }, [activeTab, requestType]);

  async function loadProfile() {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await getRoommateProfile();
      setProfile(data);
      setProfileForm(data);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileError(null);
    
    try {
      const updated = await createOrUpdateRoommateProfile(profileForm);
      setProfile(updated);
      setEditingProfile(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function loadMatches() {
    setMatchesLoading(true);
    setMatchesError(null);
    try {
      const data = await getRoommateMatches({ 
        min_score: minScore,
        favorited: favoritesOnly 
      });
      setMatches(data);
    } catch (error) {
      setMatchesError(error instanceof Error ? error.message : "Failed to load matches");
    } finally {
      setMatchesLoading(false);
    }
  }

  async function handleRefreshMatches() {
    setMatchesLoading(true);
    try {
      await refreshRoommateMatches();
      await loadMatches();
    } catch (error) {
      setMatchesError(error instanceof Error ? error.message : "Failed to refresh matches");
    } finally {
      setMatchesLoading(false);
    }
  }

  async function handleToggleFavorite(matchId: number) {
    try {
      await toggleMatchFavorite(matchId);
      await loadMatches();
    } catch (error) {
      setMatchesError(error instanceof Error ? error.message : "Failed to update favorite");
    }
  }

  async function loadRequests() {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const data = await getRoommateRequests({ type: requestType });
      setRequests(data);
    } catch (error) {
      setRequestsError(error instanceof Error ? error.message : "Failed to load requests");
    } finally {
      setRequestsLoading(false);
    }
  }

  async function handleSendRequest(match: RoommateMatch) {
    setSendingRequest(true);
    try {
      await sendRoommateRequest({
        receiver: match.match_info.id,
        message: requestMessage,
      });
      setSelectedMatch(null);
      setRequestMessage("");
      alert("Request sent successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send request");
    } finally {
      setSendingRequest(false);
    }
  }

  async function handleAcceptRequest(requestId: number) {
    try {
      await acceptRoommateRequest(requestId);
      await loadRequests();
    } catch (error) {
      setRequestsError(error instanceof Error ? error.message : "Failed to accept request");
    }
  }

  async function handleDeclineRequest(requestId: number) {
    try {
      await declineRoommateRequest(requestId);
      await loadRequests();
    } catch (error) {
      setRequestsError(error instanceof Error ? error.message : "Failed to decline request");
    }
  }

  return (
    <>
      <div className="space-y-6 pb-20">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Icon name="chevron-left" />
          </button>
          <h1 className="text-lg font-semibold">Roommate Finder</h1>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 font-medium ${
              activeTab === "profile"
                ? "text-[color:var(--brand)] border-b-2 border-[color:var(--brand)]"
                : "text-gray-500"
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-2 font-medium ${
              activeTab === "matches"
                ? "text-[color:var(--brand)] border-b-2 border-[color:var(--brand)]"
                : "text-gray-500"
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 font-medium ${
              activeTab === "requests"
                ? "text-[color:var(--brand)] border-b-2 border-[color:var(--brand)]"
                : "text-gray-500"
            }`}
          >
            Requests
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {profileLoading ? (
              <p className="text-sm text-gray-400">Loading profile...</p>
            ) : profileError ? (
              <FeedbackMessage variant="error" message={profileError} />
            ) : !profile ? (
              <FeedbackMessage variant="error" message="No profile found" />
            ) : editingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sleep Schedule</label>
                  <select
                    value={profileForm.sleep_schedule || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, sleep_schedule: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="EARLY_BIRD">Early Bird</option>
                    <option value="NIGHT_OWL">Night Owl</option>
                    <option value="FLEXIBLE">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cleanliness</label>
                  <select
                    value={profileForm.cleanliness_level || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, cleanliness_level: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="VERY_CLEAN">Very Clean</option>
                    <option value="MODERATELY_CLEAN">Moderately Clean</option>
                    <option value="RELAXED">Relaxed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Social Preference</label>
                  <select
                    value={profileForm.social_preference || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, social_preference: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="VERY_SOCIAL">Very Social</option>
                    <option value="MODERATELY_SOCIAL">Moderately Social</option>
                    <option value="PREFER_QUIET">Prefer Quiet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Study Habits</label>
                  <select
                    value={profileForm.study_habits || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, study_habits: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="LIBRARY">Library</option>
                    <option value="DORM">Dorm</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Interests</label>
                  <input
                    type="text"
                    value={profileForm.interests || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                    placeholder="e.g., sports, music, gaming"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Budget Range</label>
                  <input
                    type="text"
                    value={profileForm.budget_range || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, budget_range: e.target.value })}
                    placeholder="e.g., $500-800/month"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={profileForm.bio || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell potential roommates about yourself"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(profileForm.bio || "").length}/500 characters
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="flex-1 bg-[color:var(--brand)] text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
                  >
                    {profileSubmitting ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm(profile);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Your Preferences</h2>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-[color:var(--brand)] text-sm font-medium hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* Preference Cards with Icons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Sleep Schedule Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="bed" className="w-5 h-5 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">Sleep</span>
                    </div>
                    <p className="text-sm font-semibold text-purple-900">
                      {formatEnumValue(profile.sleep_schedule)}
                    </p>
                  </div>

                  {/* Cleanliness Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="sparkles" className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Cleanliness</span>
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      {formatEnumValue(profile.cleanliness_level)}
                    </p>
                  </div>

                  {/* Social Preference Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="users" className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Social</span>
                    </div>
                    <p className="text-sm font-semibold text-green-900">
                      {formatEnumValue(profile.social_preference)}
                    </p>
                  </div>

                  {/* Study Habits Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="graduation-cap" className="w-5 h-5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Study</span>
                    </div>
                    <p className="text-sm font-semibold text-amber-900">
                      {formatEnumValue(profile.study_habits)}
                    </p>
                  </div>
                </div>

                {/* Additional Info Section */}
                {(profile.interests || profile.budget_range || profile.bio) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    {profile.interests && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.split(",").map((interest, idx) => (
                            <span 
                              key={idx}
                              className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                            >
                              {interest.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {profile.budget_range && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Budget Range</p>
                        <p className="text-sm text-gray-800">{profile.budget_range}</p>
                      </div>
                    )}

                    {profile.bio && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">About Me</p>
                        <p className="text-sm text-gray-800 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={handleRefreshMatches}
                className="bg-[color:var(--brand)] text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                Refresh Matches
              </button>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Favorites Only</span>
              </label>
            </div>

            {matchesLoading ? (
              <p className="text-sm text-gray-400">Loading matches...</p>
            ) : matchesError ? (
              <FeedbackMessage variant="error" message={matchesError} />
            ) : matches.length === 0 ? (
              <p className="text-sm text-gray-400">No matches found. Try adjusting your filters.</p>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{match.match_info.full_name}</h3>
                        <p className="text-sm text-gray-500">{match.match_info.university_domain}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[color:var(--brand)]">
                          {match.compatibility_score}%
                        </span>
                        <button
                          onClick={() => handleToggleFavorite(match.id)}
                          className="p-2"
                        >
                          <Icon 
                            name="heart" 
                            className={match.is_favorited ? "fill-red-500 text-red-500" : "text-gray-400"}
                          />
                        </button>
                      </div>
                    </div>

                    {match.match_profile && (
                      <div className="text-sm space-y-1">
                        <p><strong>Sleep:</strong> {formatEnumValue(match.match_profile.sleep_schedule)}</p>
                        <p><strong>Cleanliness:</strong> {formatEnumValue(match.match_profile.cleanliness_level)}</p>
                        <p><strong>Social:</strong> {formatEnumValue(match.match_profile.social_preference)}</p>
                        {match.match_profile.bio && <p><strong>Bio:</strong> {match.match_profile.bio}</p>}
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="w-full bg-[color:var(--brand)] text-white rounded-lg px-4 py-2 text-sm font-medium"
                    >
                      Send Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setRequestType("sent")}
                className={`px-4 py-2 rounded-lg text-sm ${
                  requestType === "sent" ? "bg-[color:var(--brand)] text-white" : "bg-gray-200"
                }`}
              >
                Sent
              </button>
              <button
                onClick={() => setRequestType("received")}
                className={`px-4 py-2 rounded-lg text-sm ${
                  requestType === "received" ? "bg-[color:var(--brand)] text-white" : "bg-gray-200"
                }`}
              >
                Received
              </button>
              <button
                onClick={() => setRequestType("all")}
                className={`px-4 py-2 rounded-lg text-sm ${
                  requestType === "all" ? "bg-[color:var(--brand)] text-white" : "bg-gray-200"
                }`}
              >
                All
              </button>
            </div>

            {requestsLoading ? (
              <p className="text-sm text-gray-400">Loading requests...</p>
            ) : requestsError ? (
              <FeedbackMessage variant="error" message={requestsError} />
            ) : requests.length === 0 ? (
              <p className="text-sm text-gray-400">No requests found.</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {requestType === "sent" 
                            ? request.receiver_info.full_name 
                            : request.sender_info.full_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {requestType === "sent" 
                            ? request.receiver_info.email 
                            : request.sender_info.email}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        request.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {formatEnumValue(request.status)}
                      </span>
                    </div>

                    {request.message && (
                      <p className="text-sm">{request.message}</p>
                    )}

                    {request.status === "PENDING" && requestType === "received" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="flex-1 bg-green-500 text-white rounded-lg px-4 py-2 text-sm font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2 text-sm font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send Request Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-semibold">Send Request to {selectedMatch.match_info.full_name}</h2>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Introduce yourself..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSendRequest(selectedMatch)}
                disabled={sendingRequest}
                className="flex-1 bg-[color:var(--brand)] text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
              >
                {sendingRequest ? "Sending..." : "Send"}
              </button>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setRequestMessage("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomMenu />
    </>
  );
}