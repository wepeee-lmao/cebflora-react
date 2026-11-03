import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import FlipCard from '../components/FlipCard';
import Footer from '../components/Footer';
import usePageTitle from '../lib/usePageTitle';
import '../styles/landing.css';

export default function Landing() {
  usePageTitle('CebFlora — A Cebu-based Local Web Herbarium');

  return (
    <>
      <LandingNavbar />

      <section className="hero">
        <div className="hero-content">
          <h1>Discover the<br />plants of <span className="accent">Cebu</span>.</h1>
          <p>
            CebFlora brings Cebu's native and endemic flora online, so you can browse,
            filter, and study local species from anywhere.
          </p>
          <Link to="/login" className="btn btn-primary">Start Your Journey</Link>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 30, fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
            One account to save plants, or apply to become a curator.
          </p>
        </div>
      </section>

      <section className="section1">
        <h2 className="h2 h2-how">HOW CEBFLORA WORKS</h2>
        <div>
          <h2 className="h2 h2-ex">Explore.Learn.Grow</h2>
        </div>
        <div className="trust-cards">
          <FlipCard className="loc1">
            <h3 className="wrapper-search">Search &amp; Browse</h3>
            <h4 className="h4 num-01">01</h4>
            <div className="card-image-frame frame-search"></div>
            <p className="p-search">
              <span>Filter the catalog by family, genus, Cebuano name, or ecological zone, and open full plant profiles with photos.</span>
            </p>
          </FlipCard>
          <FlipCard className="loc2">
            <h4 className="h4 num-02">02</h4>
            <h3 className="wrapper-learn">Learn &amp; Identify</h3>
            <div className="card-image-frame frame-learn"></div>
            <p className="p-learn">
              <span>Test yourself with the taxonomy quiz, compare species side by side, or use the wizard to identify an unknown plant.</span>
            </p>
          </FlipCard>
          <FlipCard className="loc3">
            <h3 className="wrapper-save">Save &amp; Contribute</h3>
            <div className="card-image-frame frame-save"></div>
            <h4 className="h4 num-03">03</h4>
            <p className="p-save">
              <span>Bookmark plants to your dashboard, or apply as a curator to publish verified species records.</span>
            </p>
          </FlipCard>
        </div>
      </section>

      <section className="section2">
        <h2 className="h2-secmain">
          Rooted in Trust.<br />
          <span style={{ color: 'var(--color-accent-yellow)' }}>Verified by Curators.</span>
        </h2>
        <p className="p-secmain">
          Only approved curators can edit plant records, every curator is verified by staff,
          and rare species are shown by general zone only.
        </p>
        <div className="pos trust-cards">
          <div className="trust-card">
            <h3 className="cardfstyle">Curator Verification</h3>
            <p>Applicants submit academic or organizational proof, and admins review it before granting curator access.</p>
          </div>
          <div className="trust-card">
            <h3 className="cardfstyle">Curated Records</h3>
            <p>Only verified curators can add or edit species, and publisher profiles show who verified each record.</p>
          </div>
          <div className="trust-card">
            <h3 className="cardfstyle">Protected Species</h3>
            <p>Only general ecological zones are shown, never exact GPS, to keep rare and endangered plants safe.</p>
          </div>
        </div>
      </section> 

        <section className="section2">
          <h2 className="sec3 h2loc">
            FULLY <br />EXPERIENCE<br />
            <span className="sub">THE DIGITAL HERBARIUM</span>
          </h2>
          <div className="trust-cards">
            <div className="card-image-frame2 frame1">
              <h3 className="fstyle1">ON YOUR SMARTPHONE</h3>
            </div>
            <div className="card-image-frame2 frame2">
              <h3 className="fstyle2">ON YOUR DESKTOP</h3>
            </div>
            <div>
              <h3 className="fstyle3">BROWSE  ⑉ FILTER  ⑉ VIEW PLANT RECORDS ANYTIME</h3>
            </div>
          </div>
            <div className="v-line">
            </div>
        </section>

      <section className="section4">
        <div className="floc">
          <div className="fstyle">
            <h2>Your journey begins now.</h2> 
          </div>
          <p className="pstyle">Join locals in discovering and managing new plant records.</p>
        </div>
        <Link to="/login" className="btn btn-primary">Create an account &rarr;</Link>
      </section>

      <Footer />
    </>
  );
}
