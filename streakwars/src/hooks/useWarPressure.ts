"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export function useWarPressure() {
  const { user } = useUser();
  const [pressureLevel, setPressureLevel] = useState(0);
  const [effects, setEffects] = useState({
    rickRoll: false,
    frozenButtons: [] as string[],
    dareRequired: false,
    verificationRequired: false,
    coinPenalty: 0,
    slowAnimations: false,
    invertedColors: false,
    shakeEffect: false,
  });

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const pendingWars = useQuery(api.challengeWars.getPendingWars, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  useEffect(() => {
    if (pendingWars && pendingWars.length > 0) {
      const level = Math.min(pendingWars.length, 5);
      setPressureLevel(level);

      // Progressive pressure effects
      const newEffects = {
        rickRoll: level >= 1 && Math.random() < 0.15,
        frozenButtons: level >= 2 ? ['create-habit', 'join-challenge', 'add-friend'].slice(0, level - 1) : [],
        dareRequired: level >= 3 && Math.random() < 0.4,
        verificationRequired: level >= 4,
        coinPenalty: level >= 5 ? level * 10 : 0,
        slowAnimations: level >= 2,
        invertedColors: level >= 4 && Math.random() < 0.3,
        shakeEffect: level >= 3 && Math.random() < 0.2,
      };

      setEffects(newEffects);

      // Auto-reset some effects
      if (newEffects.rickRoll) {
        setTimeout(() => setEffects(prev => ({ ...prev, rickRoll: false })), 8000);
      }
      if (newEffects.shakeEffect) {
        setTimeout(() => setEffects(prev => ({ ...prev, shakeEffect: false })), 3000);
      }
    } else {
      setPressureLevel(0);
      setEffects({
        rickRoll: false,
        frozenButtons: [],
        dareRequired: false,
        verificationRequired: false,
        coinPenalty: 0,
        slowAnimations: false,
        invertedColors: false,
        shakeEffect: false,
      });
    }
  }, [pendingWars]);

  const isButtonFrozen = (buttonId: string) => effects.frozenButtons.includes(buttonId);
  
  const getButtonProps = (buttonId: string) => {
    const frozen = isButtonFrozen(buttonId);
    return {
      disabled: frozen,
      className: frozen 
        ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400" 
        : "",
      title: frozen ? "Button frozen due to pending wars! ⚔️" : "",
    };
  };

  const getContainerProps = () => {
    const classes = [];
    if (effects.slowAnimations) classes.push("animate-pulse");
    if (effects.invertedColors) classes.push("invert");
    if (effects.shakeEffect) classes.push("animate-bounce");
    
    return {
      className: classes.join(" "),
      style: effects.slowAnimations ? { animationDuration: "3s" } : {},
    };
  };

  const completeDare = () => {
    setEffects(prev => ({ ...prev, dareRequired: false }));
    // TODO: Implement dare completion tracking
  };

  const skipVerification = () => {
    setEffects(prev => ({ 
      ...prev, 
      verificationRequired: false,
      coinPenalty: prev.coinPenalty + 25 
    }));
  };

  const passVerification = (input: string) => {
    if (input === "I WILL WIN THIS WAR") {
      setEffects(prev => ({ ...prev, verificationRequired: false }));
      return true;
    }
    return false;
  };

  return {
    pressureLevel,
    pendingWarsCount: pendingWars?.length || 0,
    effects,
    isButtonFrozen,
    getButtonProps,
    getContainerProps,
    completeDare,
    skipVerification,
    passVerification,
  };
}
