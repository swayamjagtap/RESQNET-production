import React from 'react';
import { Link } from 'react-router-dom';
import { ResqnetLogo } from './ResqnetLogo';

export const SiteFooter: React.FC = () => {
    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <div className="site-footer-top">
                    <div className="site-footer-brand">
                        <ResqnetLogo
                            size={34}
                            compact
                        />

                        <p className="site-footer-description">
                            Transparent disaster-relief resource allocation.
                        </p>
                    </div>

                    <nav
                        className="site-footer-nav"
                        aria-label="Footer navigation"
                    >
                        <Link to="/">Overview</Link>
                        <Link to="/why">Why</Link>
                        <Link to="/how-it-works">How it works</Link>
                        <Link to="/evidence">Evidence</Link>
                        <Link to="/roadmap">Roadmap</Link>
                        <Link to="/demo">Demo</Link>
                    </nav>
                </div>

                <div className="site-footer-bottom">
                    <span>
                        Problem Statement EL-02 · Team No Free Lunch
                    </span>

                    <span className="site-footer-status">
                        RESQNET MVP
                    </span>
                </div>
            </div>
        </footer>
    );
};