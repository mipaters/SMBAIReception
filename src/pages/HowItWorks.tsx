import { Link } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { getOperator } from "../data/operators";

export function HowItWorks() {
  const { operatorId } = useDemo();
  const operator = getOperator(operatorId);

  return (
    <div>
      <div className="page-title">How It Works</div>
      <p className="page-subtitle">
        {operator.productName} answers calls an SMB misses, so every customer gets a helpful response — day or night.
      </p>

      <div className="card">
        <div className="arch-component">
          <div className="arch-name">
            <span>1️⃣</span>
            <span>The owner sets it up once</span>
          </div>
          <div className="arch-body">
            In the Setup wizard, the owner enters their business name and website. SMB AI Receptionist extracts hours,
            services, location, and common questions, then the owner picks a greeting style and voice.
          </div>
        </div>
        <div className="arch-component">
          <div className="arch-name">
            <span>2️⃣</span>
            <span>Unanswered calls are forwarded</span>
          </div>
          <div className="arch-body">
            When the business line goes unanswered — after hours, during a busy moment, or on a job site — the call
            is forwarded to SMB AI Receptionist instead of ringing out or going to generic voicemail.
          </div>
        </div>
        <div className="arch-component">
          <div className="arch-name">
            <span>3️⃣</span>
            <span>The AI greets and helps the caller</span>
          </div>
          <div className="arch-body">
            SMB AI Receptionist greets the caller with the owner's chosen script, answers questions using the business's own
            information, and offers to book an appointment if that's what the caller needs.
          </div>
        </div>
        <div className="arch-component">
          <div className="arch-name">
            <span>4️⃣</span>
            <span>The owner is texted to confirm</span>
          </div>
          <div className="arch-body">
            Before finalizing a booking, SMB AI Receptionist texts the owner to confirm availability. Once approved, the
            caller gets a confirmation text too — no app required on either end.
          </div>
        </div>
        <div className="arch-component">
          <div className="arch-name">
            <span>5️⃣</span>
            <span>Everything is logged</span>
          </div>
          <div className="arch-body">
            Every call is recorded as a transcript the owner can review later, and every appointment shows up on the
            Appointments page with its current status.
          </div>
        </div>
      </div>

      <Link to="/architecture" className="btn btn-outline btn-block">
        See the technical architecture →
      </Link>
    </div>
  );
}
