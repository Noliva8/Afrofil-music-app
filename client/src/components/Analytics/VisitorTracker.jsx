import { useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { useLocation } from "react-router-dom";


import {
  ATTACH_VISITOR_TO_USER,
  START_VISITOR_VISIT,
} from "../../utils/mutations.js";


// import advertizerAuth from "../../utils/advertizerAuth";

import UserAuth from "../../utils/auth.js";




const VISITOR_ID_KEY = "flolup_visitor_id";
const VISIT_ID_KEY = "flolup_visit_id";
const ATTACHED_VISIT_KEY = "flolup_attached_visit_id";



const createId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `flolup_visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};


const getVisitorId = () => {
  const existingVisitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (existingVisitorId) {
    return existingVisitorId;
  }

  const visitorId = createId();
  localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
};

export function VisitorTracker() {







  const location = useLocation();
  const hasTrackedPageLoad = useRef(false);
  const [startVisitorVisit] = useMutation(START_VISITOR_VISIT);
  const [attachVisitorToUser] = useMutation(ATTACH_VISITOR_TO_USER);


  useEffect(() => {
    const trackVisit = async () => {
      if (hasTrackedPageLoad.current) {
        return;
      }

      hasTrackedPageLoad.current = true;
      const visitorId = getVisitorId();

      try {
        const { data } = await startVisitorVisit({
          variables: { visitorId },
        });
        const visitId = data?.startVisitorVisit?.visitId;

        if (visitId) {
          sessionStorage.setItem(VISIT_ID_KEY, visitId);
          console.info("Visitor visit started:", { visitorId, visitId });
        }
      } catch (error) {
        hasTrackedPageLoad.current = false;
        console.error("Error starting visitor visit:", error);
      }
    };

    trackVisit();
  }, [startVisitorVisit]);

  useEffect(() => {
    const attachVisit = async () => {
      if (!UserAuth.getProfile()) {
        return;
      }

      const visitorId = localStorage.getItem(VISITOR_ID_KEY);
      const visitId = sessionStorage.getItem(VISIT_ID_KEY);

      if (!visitorId || !visitId || sessionStorage.getItem(ATTACHED_VISIT_KEY) === visitId) {
        return;
      }

      try {
        await attachVisitorToUser({
          variables: {
            visitorId,
            visitId,
            isNewUser: false,
          },
        });
        sessionStorage.setItem(ATTACHED_VISIT_KEY, visitId);
      } catch (error) {
        console.error("Error attaching visitor to user:", error);
      }
    };

    attachVisit();
  }, [attachVisitorToUser, location.pathname]);

  return null;
}
