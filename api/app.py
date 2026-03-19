"""
Civil Registrar — Flask REST API
Run: python app.py
Deploy: Render / Railway / Fly.io
"""

import os
import io
from datetime import datetime, date, timedelta
from functools import wraps

from flask import Flask, request, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import qrcode
from itsdangerous import URLSafeSerializer
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas as rl_canvas

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH  = os.path.join(BASE_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "announcements")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config["SECRET_KEY"]                = os.environ.get("SECRET_KEY", "change-me-in-production")
app.config["SQLALCHEMY_DATABASE_URI"]   = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_SAMESITE"]   = "None"
app.config["SESSION_COOKIE_SECURE"]     = True

db   = SQLAlchemy(app)
CORS(app, supports_credentials=True, origins=os.environ.get("FRONTEND_URL", "*"))


# ─────────────────────────────────────────
# Models
# ─────────────────────────────────────────

class Admin(db.Model):
    __tablename__ = "admins"
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, pw): self.password_hash = generate_password_hash(pw)
    def check_password(self, pw): return check_password_hash(self.password_hash, pw)


class Service(db.Model):
    __tablename__ = "services"
    id                 = db.Column(db.Integer, primary_key=True)
    name               = db.Column(db.String(120), nullable=False)
    description        = db.Column(db.Text)
    required_documents = db.Column(db.Text)
    created_at         = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at         = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "description": self.description,
                "required_documents": self.required_documents,
                "created_at": self.created_at.isoformat(), "updated_at": self.updated_at.isoformat()}


class Announcement(db.Model):
    __tablename__ = "announcements"
    id         = db.Column(db.Integer, primary_key=True)
    title      = db.Column(db.String(200), nullable=False)
    content    = db.Column(db.Text, nullable=False)
    image      = db.Column(db.String(255))
    is_active  = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "title": self.title, "content": self.content,
                "image": self.image, "is_active": self.is_active,
                "created_at": self.created_at.isoformat(), "updated_at": self.updated_at.isoformat()}


class Achievement(db.Model):
    __tablename__ = "achievements"
    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    achieved_on = db.Column(db.Date)
    is_active   = db.Column(db.Boolean, default=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "title": self.title, "description": self.description,
                "achieved_on": self.achieved_on.isoformat() if self.achieved_on else None,
                "is_active": self.is_active,
                "created_at": self.created_at.isoformat(), "updated_at": self.updated_at.isoformat()}


class Transaction(db.Model):
    __tablename__ = "transactions"
    id               = db.Column(db.Integer, primary_key=True)
    resident_name    = db.Column(db.String(120), nullable=False)
    transaction_type = db.Column(db.String(120), nullable=False)
    service_id       = db.Column(db.Integer, db.ForeignKey("services.id"))
    status           = db.Column(db.String(20), default="Pending")
    notes            = db.Column(db.Text)
    visit_date       = db.Column(db.Date, nullable=False, default=date.today)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    qr_token         = db.Column(db.String(64), unique=True)
    service          = db.relationship("Service", backref="transactions")

    def to_dict(self):
        return {"id": self.id, "resident_name": self.resident_name,
                "transaction_type": self.transaction_type,
                "service_id": self.service_id,
                "service_name": self.service.name if self.service else None,
                "status": self.status, "notes": self.notes,
                "visit_date": self.visit_date.isoformat(),
                "created_at": self.created_at.isoformat(),
                "qr_token": self.qr_token}


# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_id"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


def generate_qr_token(txn):
    s = URLSafeSerializer(app.config["SECRET_KEY"], salt="txn-qr")
    return s.dumps(f"{txn.id}-{txn.created_at.timestamp()}")


def seed():
    if not Admin.query.first():
        a = Admin(username="admin"); a.set_password("admin123"); db.session.add(a)
    if not Service.query.first():
        for name, desc, docs in [
            ("Birth Certificate Registration","Register a new birth and issue certificate.","Valid ID of parents;Birth notification;Hospital records"),
            ("Marriage Certificate Registration","Register a marriage and issue certificate.","Valid IDs;Marriage license;Application form"),
            ("Death Certificate Registration","Register a death and issue certificate.","Valid ID of relative;Medical certificate;Hospital records"),
            ("Certificate Requests","Request copies of existing civil registry documents.","Valid ID;Filled request form"),
            ("Correction of Records","Process corrections/updates to civil documents.","Supporting documents;Affidavit;Valid ID"),
        ]:
            db.session.add(Service(name=name, description=desc, required_documents=docs))
    if not Achievement.query.first():
        db.session.add(Achievement(title="ISO-Compliant Service Improvement",
            description="Successfully implemented process improvements.",
            achieved_on=date.today(), is_active=True))
    db.session.commit()


with app.app_context():
    db.create_all()
    seed()


# ─────────────────────────────────────────
# Auth
# ─────────────────────────────────────────

@app.route("/api/auth/login", methods=["POST"])
def login():
    data  = request.get_json()
    admin = Admin.query.filter_by(username=data.get("username")).first()
    if admin and admin.check_password(data.get("password", "")):
        session["admin_id"]       = admin.id
        session["admin_username"] = admin.username
        return jsonify({"ok": True, "username": admin.username})
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/auth/me")
def me():
    if session.get("admin_id"):
        return jsonify({"authenticated": True, "username": session["admin_username"]})
    return jsonify({"authenticated": False}), 401


# ─────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────

@app.route("/api/dashboard")
@login_required
def dashboard():
    today            = date.today()
    first_of_month   = today.replace(day=1)
    first_of_last    = (first_of_month - timedelta(days=1)).replace(day=1)
    last_month_end   = first_of_month - timedelta(days=1)

    total_transactions  = Transaction.query.count()
    total_announcements = Announcement.query.count()
    total_services      = Service.query.count()
    total_achievements  = Achievement.query.count()

    today_txns      = Transaction.query.filter_by(visit_date=today)
    today_total     = today_txns.count()
    today_completed = today_txns.filter_by(status="Completed").count()
    today_pending   = today_txns.filter_by(status="Pending").count()
    today_processing= today_txns.filter_by(status="Processing").count()

    this_month  = Transaction.query.filter(Transaction.visit_date >= first_of_month, Transaction.visit_date <= today).count()
    last_month  = Transaction.query.filter(Transaction.visit_date >= first_of_last, Transaction.visit_date <= last_month_end).count()
    month_pct   = round(((this_month - last_month) / last_month) * 100, 1) if last_month > 0 else None

    completed_total = Transaction.query.filter_by(status="Completed").count()
    completion_rate = round((completed_total / total_transactions) * 100, 1) if total_transactions > 0 else 0

    status_pending    = Transaction.query.filter_by(status="Pending").count()
    status_processing = Transaction.query.filter_by(status="Processing").count()

    thirty_ago   = today - timedelta(days=30)
    daily_visits = db.session.query(Transaction.visit_date, db.func.count(Transaction.id))\
        .filter(Transaction.visit_date >= thirty_ago)\
        .group_by(Transaction.visit_date).order_by(Transaction.visit_date).all()

    services_counts = db.session.query(Service.name, db.func.count(Transaction.id))\
        .join(Transaction, Transaction.service_id == Service.id)\
        .group_by(Service.id).order_by(db.func.count(Transaction.id).desc()).all()

    monthly_counts = db.session.query(
        db.func.strftime("%Y-%m", Transaction.visit_date),
        db.func.count(Transaction.id))\
        .group_by(db.func.strftime("%Y-%m", Transaction.visit_date))\
        .order_by(db.func.strftime("%Y-%m", Transaction.visit_date)).limit(6).all()

    weekly_counts = db.session.query(
        db.func.strftime("%Y-%W", Transaction.visit_date),
        db.func.count(Transaction.id))\
        .group_by(db.func.strftime("%Y-%W", Transaction.visit_date))\
        .order_by(db.func.strftime("%Y-%W", Transaction.visit_date)).limit(8).all()

    top_residents = db.session.query(Transaction.resident_name, db.func.count(Transaction.id))\
        .group_by(Transaction.resident_name)\
        .order_by(db.func.count(Transaction.id).desc()).limit(5).all()

    recent = Transaction.query.order_by(Transaction.created_at.desc()).limit(5).all()

    return jsonify({
        "summary": {"total_transactions": total_transactions, "total_announcements": total_announcements,
                    "total_services": total_services, "total_achievements": total_achievements},
        "today": {"total": today_total, "completed": today_completed,
                  "pending": today_pending, "processing": today_processing},
        "month": {"this": this_month, "last": last_month, "change_pct": month_pct},
        "completion_rate": completion_rate,
        "status": {"pending": status_pending, "processing": status_processing, "completed": completed_total},
        "charts": {
            "daily": {"labels": [str(d[0]) for d in daily_visits], "values": [d[1] for d in daily_visits]},
            "services": {"labels": [s[0] for s in services_counts], "values": [s[1] for s in services_counts]},
            "monthly": {"labels": [m[0] for m in monthly_counts], "values": [m[1] for m in monthly_counts]},
            "weekly": {"labels": [f"Wk {w[0].split('-')[1]}" for w in weekly_counts], "values": [w[1] for w in weekly_counts]},
        },
        "top_residents": [{"name": r[0], "count": r[1]} for r in top_residents],
        "recent_transactions": [t.to_dict() for t in recent],
    })


# ─────────────────────────────────────────
# Transactions
# ─────────────────────────────────────────

@app.route("/api/transactions")
@login_required
def get_transactions():
    q          = request.args.get("q", "")
    service_id = request.args.get("service_id")
    status     = request.args.get("status")
    start      = request.args.get("start_date")
    end        = request.args.get("end_date")
    query      = Transaction.query
    if q:          query = query.filter(Transaction.resident_name.ilike(f"%{q}%"))
    if service_id: query = query.filter(Transaction.service_id == int(service_id))
    if status:     query = query.filter(Transaction.status == status)
    if start:      query = query.filter(Transaction.visit_date >= datetime.strptime(start, "%Y-%m-%d").date())
    if end:        query = query.filter(Transaction.visit_date <= datetime.strptime(end, "%Y-%m-%d").date())
    txns = query.order_by(Transaction.created_at.desc()).all()
    return jsonify([t.to_dict() for t in txns])


@app.route("/api/transactions", methods=["POST"])
@login_required
def create_transaction():
    d   = request.get_json()
    txn = Transaction(resident_name=d["resident_name"], transaction_type=d["transaction_type"],
                      service_id=d.get("service_id"), status=d.get("status","Pending"),
                      notes=d.get("notes"), visit_date=datetime.strptime(d["visit_date"],"%Y-%m-%d").date())
    db.session.add(txn); db.session.flush()
    txn.qr_token = generate_qr_token(txn)
    db.session.commit()
    return jsonify(txn.to_dict()), 201


@app.route("/api/transactions/<int:txn_id>", methods=["PUT"])
@login_required
def update_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    d   = request.get_json()
    txn.resident_name    = d.get("resident_name", txn.resident_name)
    txn.transaction_type = d.get("transaction_type", txn.transaction_type)
    txn.service_id       = d.get("service_id", txn.service_id)
    txn.status           = d.get("status", txn.status)
    txn.notes            = d.get("notes", txn.notes)
    if d.get("visit_date"): txn.visit_date = datetime.strptime(d["visit_date"],"%Y-%m-%d").date()
    if not txn.qr_token: txn.qr_token = generate_qr_token(txn)
    db.session.commit()
    return jsonify(txn.to_dict())


@app.route("/api/transactions/<int:txn_id>", methods=["DELETE"])
@login_required
def delete_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    db.session.delete(txn); db.session.commit()
    return jsonify({"ok": True})


@app.route("/api/transactions/<int:txn_id>/qr")
@login_required
def transaction_qr(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    if not txn.qr_token:
        txn.qr_token = generate_qr_token(txn); db.session.commit()
    qr_url = f"{request.host_url}t/{txn.qr_token}"
    img    = qrcode.make(qr_url)
    buf    = io.BytesIO(); img.save(buf, format="PNG"); buf.seek(0)
    return send_file(buf, mimetype="image/png")


# ─────────────────────────────────────────
# Services
# ─────────────────────────────────────────

@app.route("/api/services")
def get_services():
    return jsonify([s.to_dict() for s in Service.query.order_by(Service.name).all()])


@app.route("/api/services", methods=["POST"])
@login_required
def create_service():
    d   = request.get_json()
    svc = Service(name=d["name"], description=d.get("description"), required_documents=d.get("required_documents"))
    db.session.add(svc); db.session.commit()
    return jsonify(svc.to_dict()), 201


@app.route("/api/services/<int:svc_id>", methods=["PUT"])
@login_required
def update_service(svc_id):
    svc = Service.query.get_or_404(svc_id)
    d   = request.get_json()
    svc.name               = d.get("name", svc.name)
    svc.description        = d.get("description", svc.description)
    svc.required_documents = d.get("required_documents", svc.required_documents)
    db.session.commit()
    return jsonify(svc.to_dict())


@app.route("/api/services/<int:svc_id>", methods=["DELETE"])
@login_required
def delete_service(svc_id):
    svc = Service.query.get_or_404(svc_id)
    db.session.delete(svc); db.session.commit()
    return jsonify({"ok": True})


# ─────────────────────────────────────────
# Announcements
# ─────────────────────────────────────────

@app.route("/api/announcements")
def get_announcements():
    only_active = request.args.get("active") == "1"
    q = Announcement.query
    if only_active: q = q.filter_by(is_active=True)
    return jsonify([a.to_dict() for a in q.order_by(Announcement.created_at.desc()).all()])


@app.route("/api/announcements/<int:ann_id>")
def get_announcement(ann_id):
    return jsonify(Announcement.query.get_or_404(ann_id).to_dict())


@app.route("/api/announcements", methods=["POST"])
@login_required
def create_announcement():
    title    = request.form.get("title")
    content  = request.form.get("content")
    is_active= request.form.get("is_active","1") == "1"
    image_fn = None
    if "image" in request.files:
        f = request.files["image"]
        if f.filename:
            image_fn = secure_filename(f.filename)
            f.save(os.path.join(UPLOAD_FOLDER, image_fn))
    ann = Announcement(title=title, content=content, image=image_fn, is_active=is_active)
    db.session.add(ann); db.session.commit()
    return jsonify(ann.to_dict()), 201


@app.route("/api/announcements/<int:ann_id>", methods=["PUT"])
@login_required
def update_announcement(ann_id):
    ann       = Announcement.query.get_or_404(ann_id)
    ann.title = request.form.get("title", ann.title)
    ann.content = request.form.get("content", ann.content)
    ann.is_active = request.form.get("is_active","1") == "1"
    if "image" in request.files:
        f = request.files["image"]
        if f.filename:
            fn = secure_filename(f.filename)
            f.save(os.path.join(UPLOAD_FOLDER, fn))
            ann.image = fn
    db.session.commit()
    return jsonify(ann.to_dict())


@app.route("/api/announcements/<int:ann_id>", methods=["DELETE"])
@login_required
def delete_announcement(ann_id):
    ann = Announcement.query.get_or_404(ann_id)
    db.session.delete(ann); db.session.commit()
    return jsonify({"ok": True})


# ─────────────────────────────────────────
# Achievements
# ─────────────────────────────────────────

@app.route("/api/achievements")
def get_achievements():
    only_active = request.args.get("active") == "1"
    q = Achievement.query
    if only_active: q = q.filter_by(is_active=True)
    return jsonify([a.to_dict() for a in q.order_by(Achievement.created_at.desc()).all()])


@app.route("/api/achievements", methods=["POST"])
@login_required
def create_achievement():
    d   = request.get_json()
    ach = Achievement(title=d["title"], description=d.get("description"),
                      achieved_on=datetime.strptime(d["achieved_on"],"%Y-%m-%d").date() if d.get("achieved_on") else None,
                      is_active=d.get("is_active", True))
    db.session.add(ach); db.session.commit()
    return jsonify(ach.to_dict()), 201


@app.route("/api/achievements/<int:ach_id>", methods=["PUT"])
@login_required
def update_achievement(ach_id):
    ach = Achievement.query.get_or_404(ach_id)
    d   = request.get_json()
    ach.title       = d.get("title", ach.title)
    ach.description = d.get("description", ach.description)
    ach.is_active   = d.get("is_active", ach.is_active)
    if d.get("achieved_on"): ach.achieved_on = datetime.strptime(d["achieved_on"],"%Y-%m-%d").date()
    db.session.commit()
    return jsonify(ach.to_dict())


@app.route("/api/achievements/<int:ach_id>", methods=["DELETE"])
@login_required
def delete_achievement(ach_id):
    ach = Achievement.query.get_or_404(ach_id)
    db.session.delete(ach); db.session.commit()
    return jsonify({"ok": True})


# ─────────────────────────────────────────
# Reports
# ─────────────────────────────────────────

@app.route("/api/reports/transactions")
@login_required
def report_transactions():
    start = request.args.get("start")
    end   = request.args.get("end")
    q     = Transaction.query
    if start: q = q.filter(Transaction.visit_date >= datetime.strptime(start,"%Y-%m-%d").date())
    if end:   q = q.filter(Transaction.visit_date <= datetime.strptime(end,"%Y-%m-%d").date())
    return jsonify([t.to_dict() for t in q.order_by(Transaction.visit_date).all()])


@app.route("/api/reports/transactions.csv")
@login_required
def report_csv():
    start  = request.args.get("start"); end = request.args.get("end")
    q      = Transaction.query
    if start: q = q.filter(Transaction.visit_date >= datetime.strptime(start,"%Y-%m-%d").date())
    if end:   q = q.filter(Transaction.visit_date <= datetime.strptime(end,"%Y-%m-%d").date())
    txns   = q.order_by(Transaction.visit_date).all()
    output = io.StringIO()
    output.write("ID,Resident Name,Transaction Type,Service,Status,Visit Date,Created At\n")
    for t in txns:
        output.write(f'{t.id},"{t.resident_name}","{t.transaction_type}","{t.service.name if t.service else ""}",{t.status},{t.visit_date},{t.created_at}\n')
    mem = io.BytesIO(output.getvalue().encode("utf-8")); mem.seek(0)
    return send_file(mem, mimetype="text/csv", as_attachment=True, download_name="transactions_report.csv")


@app.route("/api/reports/transactions.pdf")
@login_required
def report_pdf():
    start  = request.args.get("start"); end = request.args.get("end")
    q      = Transaction.query
    if start: q = q.filter(Transaction.visit_date >= datetime.strptime(start,"%Y-%m-%d").date())
    if end:   q = q.filter(Transaction.visit_date <= datetime.strptime(end,"%Y-%m-%d").date())
    txns   = q.order_by(Transaction.visit_date).all()
    buf    = io.BytesIO()
    p      = rl_canvas.Canvas(buf, pagesize=A4)
    w, h   = A4; y = h - 50
    p.setFont("Helvetica-Bold", 14); p.drawString(50, y, "Transactions Report"); y -= 30
    p.setFont("Helvetica", 10)
    for t in txns:
        if y < 50: p.showPage(); y = h - 50; p.setFont("Helvetica", 10)
        p.drawString(50, y, f"#{t.id} {t.visit_date} - {t.resident_name} [{t.status}]"); y -= 15
    p.showPage(); p.save(); buf.seek(0)
    return send_file(buf, mimetype="application/pdf", as_attachment=True, download_name="transactions_report.pdf")


@app.route("/api/reports/top-services.csv")
@login_required
def report_top_services():
    rows   = db.session.query(Service.name, db.func.count(Transaction.id))\
               .join(Transaction, Transaction.service_id == Service.id)\
               .group_by(Service.id).order_by(db.func.count(Transaction.id).desc()).all()
    output = io.StringIO()
    output.write("Service Name,Total Transactions\n")
    for name, count in rows: output.write(f'"{name}",{count}\n')
    mem = io.BytesIO(output.getvalue().encode("utf-8")); mem.seek(0)
    return send_file(mem, mimetype="text/csv", as_attachment=True, download_name="top_services.csv")


# ─────────────────────────────────────────
# Static uploads
# ─────────────────────────────────────────

@app.route("/uploads/announcements/<filename>")
def serve_upload(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
