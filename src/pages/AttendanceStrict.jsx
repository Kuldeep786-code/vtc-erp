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
  const [assigned] = useState({ lat: 0, lng: 0 })
  const [strict] = useState(true)
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [status, setStatus] = useState("")
  const [selfie, setSelfie] = useState(null)
  const [webcamReady, setWebcamReady] = useState(false)

  useEffect(() => {
    // 1. Request Camera and Location permissions on mount
    requestPermissions()
    
    // 2. Continuous location tracking for field activity
    const watchId = navigator.geolocation.watchPosition(
      p => {
        const coords = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPos(coords)
        logLocation(coords) // Save for manager monitoring
      },
      err => console.error("Location error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

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

  async function checkIn() {
    if (!pos || !selfie) {
      alert("Location or Selfie missing!")
      return
    }
    const now = new Date()
    const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 45)
    setStatus("Submitting...")
    
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from("attendance").insert({
        user_id: user.id,
        timestamp: now.toISOString(),
        lat: pos.lat,
        lng: pos.lng,
        is_late: late,
        status: "pending", // Always pending for Manager approval
        selfie_base64: selfie
      })
      
      if (!error) {
        setStatus(late ? "Check-in successful (Late - Pending Approval)" : "Check-in successful (Pending Approval)")
        setSelfie(null)
      } else {
        setStatus("Error: " + error.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Strict Attendance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 text-sm text-gray-600">Live Camera</div>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full rounded-md"
            onUserMedia={() => setWebcamReady(true)}
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={captureSelfie}
              className="rounded-md bg-gold text-white px-3 py-2"
            >
              Capture Selfie
            </button>
            {selfie && <img src={selfie} alt="selfie" className="h-16 w-16 rounded-md object-cover border" />}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 text-sm text-gray-600">Location</div>
          <div className="text-sm">Current: {pos ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : "-"}</div>
          <div className="text-sm">Assigned: {`${assigned.lat}, ${assigned.lng}`}</div>
          <button
            onClick={checkIn}
            disabled={!canCheckIn || !webcamReady}
            className={`mt-4 rounded-md px-3 py-2 ${canCheckIn && webcamReady ? "bg-navy text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
          >
            Check-in
          </button>
          <div className="mt-2 text-sm text-gray-700">{status}</div>
        </div>
      </div>
    </div>
  )
}
