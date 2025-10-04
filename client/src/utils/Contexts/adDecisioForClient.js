
import { useMutation } from '@apollo/client';
import { AD_BUMPER, AD_DECISION_ENGINE } from "../mutations";



const [AdDecisionEngine]   = useMutation(AD_DECISION_ENGINE);
const [AdBumpServed] = useMutation(AD_BUMPER);



async function tryAd(user) {
  const { data } = await AdDecisionEngine({
    variables: {
      player: {
        userId: user.id,
        userTier: user.isPremium ? 'premium' : 'free',
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        availableAdTime: 30,
        wantType: 'audio',
        locationCountry: user.country ?? null,
        locationState: user.state ?? null,
        locationCity: user.city ?? null,
      }
    }
  });

  const decision = data?.adDecisionEngine;
  if (decision?.decision !== 'play_ad') return false;

  // …pick variant, presign, play…
  // when playback of the ad starts (or you accept the decision), bump:
  await AdBumpServed({ variables: { userId: user.id } });
  return true;
}