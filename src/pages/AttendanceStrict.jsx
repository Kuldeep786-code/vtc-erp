import React, { useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
import { supabase } from "../lib/supabaseClient.js"

function distanceMeters(a, b) {
  const toRad = d => (d * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export default function AttendanceStrict() {
  const webcamRef = useRef(null)
  const [pos, setPos] = useState(null)
  const [status, setStatus] = useState("")
  const [selfie, setSelfie] = useState(null)
  const [webcamReady, setWebcamReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [distance, setDistance] = useState(null)

  const [todayAttendance, setTodayAttendance] = useState(null)

  useEffect(() => {
    fetchProfile()
    fetchTodayAttendance()
    requestPermissions()

    // Fix: Get initial position immediately to avoid "Searching..." delay
    navigator.geolocation.getCurrentPosition(
      p => {
        const coords = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPos(coords)
        logLocation(coords)
      },
      err => console.error("Initial GPS error:", err),
      { enableHighAccuracy: true }
    )
    
    const watchId = navigator.geolocation.watchPosition(
      p => {
        const coords = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPos(coords)
        logLocation(coords)
      },
      err => console.error("Location error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  async function fetchTodayAttendance() {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('attendance')
      .select('*')
      .eq('profile_id', user.id)
      .gte('check_in_time', today)
      .single()
    setTodayAttendance(data)
  }

  async function checkOut() {
    if (!pos || !selfie) {
        alert("Location or Selfie missing for Check-out!");
        return;
    }
    setStatus("Checking out...");
    try {
        const now = new Date();
        const checkInTime = new Date(todayAttendance.check_in_time);
        const diffHrs = ((now - checkInTime) / (1000 * 60 * 60)).toFixed(2);
        const publicUrl = await uploadSelfie('checkout');

        const { error } = await supabase.from('attendance')
          .update({ 
            check_out_time: now.toISOString(),
            total_hours: diffHrs,
            check_out_selfie_url: publicUrl
          })
          .eq('id', todayAttendance.id);

        if (error) throw error;

        setStatus(`Check-out successful. Total Hours: ${diffHrs}`);
        setSelfie(null);
        fetchTodayAttendance();
    } catch (err) {
        setStatus(`Error: ${err.message}`);
    }
  }

  // Helper function to upload selfie and get URL
  async function uploadSelfie(type) {
    if (!selfie) return null;
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date();
    const fileName = `${user.id}-${type}-${now.toISOString()}.jpg`;
    const filePath = `${user.id}/${fileName}`;

    const base64Data = selfie.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const { error } = await supabase.storage.from('selfies').upload(filePath, blob, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from('selfies').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function fetchProfile() {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
  }

  async function requestPermissions() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setWebcamReady(true)
    } catch (err) {
      alert("Please allow Camera access for Attendance.")
    }
  }

  async function logLocation(coords) {
    if (supabase && coords) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("location_logs").insert({
          user_id: user.id,
          lat: coords.lat,
          lng: coords.lng
        })
      }
    }
  }

  function captureSelfie() {
    const img = webcamRef.current?.getScreenshot()
    setSelfie(img || null)
  }

  async function checkIn() {
    if (!pos || !selfie) {
      alert("Location or Selfie missing!");
      return;
    }
    const now = new Date();
    const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 45);
    setStatus("Submitting...");

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const publicUrl = await uploadSelfie('checkin');

        const { error: insertError } = await supabase.from("attendance").insert({
          profile_id: user.id,
          check_in_time: now.toISOString(),
          lat: pos.lat,
          lng: pos.lng,
          is_late: late,
          status: "pending",
          check_in_selfie_url: publicUrl
        });

        if (insertError) throw insertError;

        setStatus(late ? "Check-in successful (Late - Pending Approval)" : "Check-in successful (Pending Approval)");
        setSelfie(null);
        fetchTodayAttendance();
    } catch (error) {
        console.error("Check-in failed:", error);
        setStatus("Error: " + error.message);
    }
  }

  useEffect(() => {
    if (!pos || !profile) return

    console.log("--- ATTENDANCE DEBUGGER ---");
    console.log("User Profile:", profile);
    console.log("Current GPS Position (pos):", pos);

    if (profile.attendance_mode === 'flexible') {
      console.log("Mode: FLEXIBLE. Allowing check-in automatically.");
      setCanCheckIn(true)
      return
    }

    console.log("Mode: STRICT. Calculating distance...");
    const assigned = { lat: profile.assigned_lat || 0, lng: profile.assigned_lng || 0 }
    console.log("Assigned Location:", assigned);

    if (!profile.assigned_lat || !profile.assigned_lng) {
        console.error("CRITICAL: Assigned location (lat/lng) is not set for this user in 'strict' mode.");
        alert("ATTENTION: Your assigned work location is not set. Please contact your Admin/Manager to set your Latitude and Longitude.");
    }

    const dist = distanceMeters(pos, assigned)
    setDistance(dist)
    console.log(`Calculated Distance: ${dist} meters`);

    const isWithinRange = dist <= 100;
    setCanCheckIn(isWithinRange)
    console.log(`Is within 100m range? ${isWithinRange}`);
    console.log("---------------------------");

  }, [pos, profile])

  const mapsLink = profile?.assigned_lat ? `https://www.google.com/maps?q=${profile.assigned_lat},${profile.assigned_lng}` : null

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-navy">Attendance Portal</h1>
      
      {profile?.attendance_mode === 'strict' && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
            📍 Strict Mode Active (100m Geofence)
          </p>
          {mapsLink && (
            <a href={mapsLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 block">
              View assigned location on Google Maps
            </a>
          )}
          {distance !== null && (
            <p className="text-xs mt-1">Current distance: {Math.round(distance)} meters from target.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-bold text-gray-700 uppercase tracking-wider">Live Camera</div>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full rounded-xl border-4 border-gray-100"
            onUserMedia={() => setWebcamReady(true)}
          />
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={captureSelfie}
              className="flex-1 rounded-lg bg-gold text-white px-4 py-3 font-bold shadow-md hover:bg-yellow-600 transition-all"
            >
              Capture Selfie
            </button>
            {selfie && (
              <div className="relative">
                <img src={selfie} alt="selfie" className="h-16 w-16 rounded-lg object-cover border-2 border-gold shadow-sm" />
                <button onClick={() => setSelfie(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-[10px]">X</button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Status & Location</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-500">GPS Signal:</span>
                <span className={pos ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                  {pos ? "Connected" : "Searching..."}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-500">Camera:</span>
                <span className={webcamReady ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                  {webcamReady ? "Ready" : "Not Ready"}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-500">Selfie:</span>
                <span className={selfie ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                  {selfie ? "Captured" : "Required"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {todayAttendance && !todayAttendance.check_out_time ? (
                /* CHECK-OUT BUTTON */
                <button
                    onClick={checkOut}
                    disabled={!webcamReady || !selfie || !pos}
                    className={`w-full rounded-xl py-4 font-black text-lg shadow-lg transition-all ${
                        webcamReady && selfie && pos
                        ? "bg-red-600 text-white hover:scale-[1.02] active:scale-95" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    CHECK-OUT NOW
                </button>
            ) : (
                /* CHECK-IN BUTTON */
                <>
                    <button
                        onClick={checkIn}
                        disabled={todayAttendance?.check_out_time || !canCheckIn || !webcamReady || !selfie || !pos}
                        className={`w-full rounded-xl py-4 font-black text-lg shadow-lg transition-all ${
                            !todayAttendance?.check_out_time && canCheckIn && webcamReady && selfie && pos
                            ? "bg-navy text-white hover:scale-[1.02] active:scale-95" 
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {todayAttendance?.check_out_time 
                            ? "ALREADY ATTENDED" 
                            : (canCheckIn || profile?.attendance_mode === 'flexible' ? "CHECK-IN NOW" : "OUT OF RANGE")}
                    </button>
                    {profile?.attendance_mode === 'strict' && !canCheckIn && !todayAttendance && mapsLink && (
                        <div className="mt-2 text-center">
                            <a href={mapsLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                                You are out of range. View your assigned location on Google Maps.
                            </a>
                            <p className="text-xs mt-1 text-gray-500">Current distance: {Math.round(distance)} meters from target.</p>
                        </div>
                    )}
                </>
            )}
            
            <p className="mt-3 text-[10px] text-center text-gray-400 italic">
              *Attendance will be sent to Manager for approval.
            </p>
            <div className="mt-4 text-center text-sm font-bold text-navy">{status}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
