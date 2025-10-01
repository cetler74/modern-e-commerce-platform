import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface TrackEventRequest {
  eventType: string;
  sessionId?: string;
  properties?: Record<string, any>;
}

export const trackEvent = api<TrackEventRequest, void>(
  { expose: true, method: "POST", path: "/analytics/events" },
  async (req) => {
    let userId: number | null = null;
    
    try {
      const authData = getAuthData();
      if (authData) {
        userId = parseInt(authData.userID);
      }
    } catch (e) {
    }

    await db.exec`
      INSERT INTO analytics_events (event_type, user_id, session_id, properties)
      VALUES (
        ${req.eventType}, 
        ${userId}, 
        ${req.sessionId || null}, 
        ${JSON.stringify(req.properties || {})}
      )
    `;
  }
);
