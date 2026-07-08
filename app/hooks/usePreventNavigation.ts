import { useEffect } from 'react';
import { useBlocker } from 'react-router';

export function usePreventNavigation(isBlocking: boolean) {
    useEffect(() => {
        if (!isBlocking) return;

        // 1. Block reload / tab close
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
            return "";
        };

        // 2. Block back / forward navigation
        const blockNavigation = () => {
            window.history.pushState(null, "", window.location.href);
        };

        // Push a state so back button has nowhere to go
        window.history.pushState(null, "", window.location.href);

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", blockNavigation);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", blockNavigation);
        };
    }, [isBlocking]);

    useBlocker(({ currentLocation, nextLocation }) => {
        return isBlocking && currentLocation.pathname !== nextLocation.pathname;
    });
}
