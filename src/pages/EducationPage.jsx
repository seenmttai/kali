import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, CheckCircle, Database, HelpCircle, AlertTriangle } from 'lucide-react';
import LottiePlayer from '../components/common/LottiePlayer';

gsap.registerPlugin(ScrollTrigger);

export default function EducationPage() {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('article');

  useEffect(() => {
    if (activeTab !== 'article') return;
    
    const ctx = gsap.context(() => {
      // Use timeline for scrollytelling parallax
      const panels = gsap.utils.toArray('.scrolly-panel');
      
      panels.forEach((panel, i) => {
        gsap.fromTo(panel, 
          { opacity: 0, y: 50 },
          { 
            opacity: 1, 
            y: 0,
            scrollTrigger: {
              trigger: panel,
              start: 'top 80%',
              end: 'top 30%',
              scrub: 1,
            }
          }
        );
      });
      
      // Pin infographic
      ScrollTrigger.create({
        trigger: '.pinned-infographic',
        start: 'top 100px',
        end: 'bottom bottom',
        pin: '.infographic-content',
        pinSpacing: false
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, [activeTab]);

  return (
    <div ref={containerRef} style={{ paddingBottom: '100px', backgroundColor: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Education Header */}
      <div style={{ background: 'var(--color-primary-dark)', color: 'white', padding: '50px 20px', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10px', top: '20px', width: '150px', height: '150px', opacity: 0.3 }}>
          <LottiePlayer src="https://lottie.host/76fa4d5c-3f5f-4d6d-9b5d-e0e6e789d6e7/p6f3o8ve0e.json" />
        </div>
        <div style={{ zIndex: 1, position: 'relative' }}>
          <h1 style={{ margin: 0, color: 'white' }}>Education Hub</h1>
          <p style={{ opacity: 0.9 }}>Learn about your blood health</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '20px', paddingTop: '10px' }}>
        {[
          { id: 'article', label: 'What is Anemia?', icon: BookOpen },
          { id: 'diet', label: 'Diet Guide', icon: Database },
          { id: 'quiz', label: 'Quiz', icon: HelpCircle },
          { id: 'doctor', label: 'Doctor Guide', icon: AlertTriangle }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
              padding: '8px 16px', borderRadius: '20px', 
              background: activeTab === tab.id ? 'var(--color-primary)' : 'var(--bg-card)',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.id ? 'transparent' : 'var(--border-color)'}`
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Scrollytelling Article */}
        {activeTab === 'article' && (
          <div className="article-container" style={{ position: 'relative' }}>
            <div className="scrolly-panel glass-panel" style={{ padding: '24px', marginBottom: '40px' }}>
              <h2>1. The Basics</h2>
              <p>Anemia is a condition in which you lack enough healthy red blood cells to carry adequate oxygen to your body's tissues.</p>
              <div style={{ width: '100%', height: '220px', borderRadius: '12px', marginTop: '16px', overflow: 'hidden' }}>
                <LottiePlayer src="https://lottie.host/76fa4d5c-3f5f-4d6d-9b5d-e0e6e789d6e7/p6f3o8ve0e.json" />
              </div>
            </div>

            <div className="scrolly-panel glass-panel pinned-infographic" style={{ padding: '24px', marginBottom: '40px', minHeight: '600px' }}>
              <div className="infographic-content" style={{ position: 'sticky', top: '100px' }}>
                <h2>2. How it works</h2>
                <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                  <div style={{ flex: 1, padding: '20px', background: 'var(--bg-app)', textAlign: 'center', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '60px', height: '60px', margin: '0 auto 10px' }}>
                      <LottiePlayer src="https://lottie.host/76fa4d5c-3f5f-4d6d-9b5d-e0e6e789d6e7/p6f3o8ve0e.json" />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Healthy Blood (Lots of RBCs)</p>
                  </div>
                  <div style={{ flex: 1, padding: '20px', background: 'var(--bg-app)', textAlign: 'center', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '60px', height: '60px', margin: '0 auto 10px', opacity: 0.5 }}>
                      <LottiePlayer src="https://lottie.host/76fa4d5c-3f5f-4d6d-9b5d-e0e6e789d6e7/p6f3o8ve0e.json" />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Anemic Blood (Fewer RBCs)</p>
                  </div>
                </div>
                <p>Having anemia can make you feel tired and weak. There are many forms of anemia, each with its own cause.</p>
              </div>
            </div>

            <div className="scrolly-panel glass-panel" style={{ padding: '24px', marginBottom: '40px' }}>
              <h2>3. Why palms?</h2>
              <p>Your palm, nail beds, and inner eyelids are places where blood vessels are close to the surface. When hemoglobin is low, these areas appear noticeably paler than normal.</p>
            </div>
          </div>
        )}

        {/* Dummy Diet Guide */}
        {activeTab === 'diet' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2>Iron-Rich Foods</h2>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              <li style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Spinach</span> <span style={{ color: 'var(--color-success)' }}>High</span>
              </li>
              <li style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Red Meat</span> <span style={{ color: 'var(--color-success)' }}>High</span>
              </li>
              <li style={{ padding: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Lentils</span> <span style={{ color: 'var(--color-warning)' }}>Medium</span>
              </li>
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}
