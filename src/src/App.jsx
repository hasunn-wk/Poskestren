import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, deleteDoc } from 'firebase/firestore';

// --- Safe Firebase Initialization ---
let app, db, auth;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'poskestren-app';

try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        const config = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
    }
} catch (error) {
    console.error("Firebase Init Error (Using Offline Mode):", error);
}

const Icons = {
    Home: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
    Users: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
    Plus: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
    Settings: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
    Activity: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
    Check: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>),
    Search: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
    X: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
    ChevronLeft: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"/></svg>),
    Edit: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
    Trash: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
    Pill: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>),
    Clock: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
    BookOpen: ({ size = 24, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>)
};

const COLORS = {
    'Ringan': 'text-amber-500 bg-amber-50 border-amber-200',
    'Sedang': 'text-orange-500 bg-orange-50 border-orange-200',
    'Berat': 'text-red-600 bg-red-50 border-red-200',
    'Sembuh': 'text-teal-600 bg-teal-50 border-teal-200'
};

const STATUS_BADGE = {
    'Sedang sakit': 'bg-red-50 text-red-600 border border-red-100',
    'Dalam pemulihan': 'bg-amber-50 text-amber-600 border border-amber-100',
    'Sudah sembuh': 'bg-teal-50 text-teal-600 border border-teal-100'
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch {
        return dateString;
    }
};

const getDuration = (start, end) => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
};

const FormInput = ({ label, required, type="text", children, ...props }) => (
    <div className="mb-5 group">
        <label className="block text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-teal-600 transition-colors">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all outline-none font-medium text-base" rows="3" {...props}></textarea>
        ) : type === 'select' ? (
            <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all outline-none font-medium text-base appearance-none" {...props}>
                {children}
            </select>
        ) : (
            <input type={type} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all outline-none font-medium text-base" {...props} />
        )}
    </div>
);

const DUMMY_DATA = [
    { id: '1', name: 'Ahmad Rizky', age: 25, group: 'IT', mainComplaint: 'Demam dan batuk', severity: 'Ringan', status: 'Sedang sakit', startDate: '2026-10-08', startTime: '08:30', medication: 'Paracetamol 500mg, Ambroxol', progressUpdates: [{id: 'p1', date: '2026-10-08', time: '09:00', note: 'Sudah diberikan obat penurun panas dan diminta istirahat.'}] },
    { id: '2', name: 'Fajar', age: 28, group: 'HR', mainComplaint: 'Flu', severity: 'Sedang', status: 'Dalam pemulihan', startDate: '2026-10-06', startTime: '09:00', medication: 'Vitamin C, Obat Flu', progressUpdates: [] },
    { id: '3', name: 'Rizal', age: 30, group: 'Finance', mainComplaint: 'Sakit tenggorokan', severity: 'Ringan', status: 'Sudah sembuh', startDate: '2026-10-03', startTime: '10:00', recoveryDate: '2026-10-05', recoveryTime: '15:00', medication: 'Degirol', progressUpdates: [] }
];

const ARTICLES = [
    {
        id: 'a1',
        title: 'Mencegah Flu & Radang di Musim Pancaroba',
        category: 'Pencegahan',
        readTime: '3 mnt',
        date: '8 Okt 2026',
        author: 'Tim Medis',
        imageGradient: 'from-blue-400 to-indigo-500',
        content: "Cuaca pancaroba yang tidak menentu seringkali membuat daya tahan tubuh menurun. Hal ini menyebabkan kita lebih rentan terkena penyakit seperti flu, batuk, dan radang.\n\nBerikut cara ampuh mencegahnya:\n\n1. Jaga Asupan Nutrisi\nPerbanyak konsumsi sayur dan buah yang kaya vitamin C.\n\n2. Istirahat Cukup\nTidur minimal 7-8 jam sangat penting untuk memperbaiki sel-sel tubuh.\n\n3. Terhidrasi\nPastikan selalu minum air putih minimal 2 liter sehari.\n\nMari jaga kesehatan bersama!"
    },
    {
        id: 'a2',
        title: 'Waktu Tidur Ideal Agar Tubuh Selalu Fit',
        category: 'Gaya Hidup',
        readTime: '2 mnt',
        date: '7 Okt 2026',
        author: 'Klinik Sehat',
        imageGradient: 'from-teal-400 to-emerald-500',
        content: "Banyak orang menyepelekan waktu tidur, padahal tidur adalah kunci utama pemulihan energi dan imunitas tubuh.\n\n- Dewasa (18-64 thn): Butuh 7-9 jam tidur per malam.\n- Remaja (14-17 thn): Butuh 8-10 jam.\n\nKurang tidur berisiko memicu stres, menurunkan daya ingat, dan membuat tubuh mudah terserang infeksi. Yuk, biasakan tidur lebih awal dan jauhkan HP sebelum tidur!"
    },
    {
        id: 'a3',
        title: 'P3K Saat Teman Mengalami Demam Tinggi',
        category: 'Panduan',
        readTime: '4 mnt',
        date: '5 Okt 2026',
        author: 'Dr. Hasan',
        imageGradient: 'from-rose-400 to-red-500',
        content: "Demam sebenarnya adalah reaksi alami tubuh yang sedang melawan infeksi. Jangan panik saat temanmu demam tinggi.\n\nLangkah pertama:\n1. Bawa ke tempat yang sejuk dan nyaman.\n2. Berikan pakaian tipis agar panas mudah keluar.\n3. Kompres dahi dan lipatan tubuh (ketiak/paha) dengan air hangat, bukan air es!\n4. Berikan minum yang banyak untuk mencegah dehidrasi.\n\nJika demam tidak turun setelah 3 hari, segera laporkan ke klinik atau poskestren terdekat."
    }
];

export default function App() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin' atau 'viewer'
    const [isAppLoading, setIsAppLoading] = useState(true);

    const [records, setRecords] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [toastMsg, setToastMsg] = useState('');
    const [editMode, setEditMode] = useState(false);

    // Login State
    const [showLogin, setShowLogin] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        if (!auth || !db) {
            setRecords(DUMMY_DATA);
            setIsAppLoading(false);
            return;
        }

        const initFirebase = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (err) {
                console.error("Auth Error:", err);
                setRecords(DUMMY_DATA);
                setIsAppLoading(false);
            }
        };

        initFirebase();

        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const recordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'health_records');
                const unsubRecords = onSnapshot(query(recordsRef), (snapshot) => {
                    const data = snapshot.docs.map(doc => doc.data());
                    if (data.length === 0) {
                        seedDummyData(recordsRef);
                    } else {
                        data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
                        setRecords(data);
                    }
                    setIsAppLoading(false);
                }, (error) => {
                    console.error("Fetch Data Error:", error);
                    setRecords(DUMMY_DATA);
                    setIsAppLoading(false);
                });
                
                return () => unsubRecords();
            }
        });

        return () => unsubAuth();
    }, []);

    const seedDummyData = async (ref) => {
        for (const item of DUMMY_DATA) {
            await setDoc(doc(ref, item.id), item);
        }
    };

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const saveRecord = async (data) => {
        const isNew = !data.id;
        const recordToSave = {
            ...data,
            id: isNew ? generateId() : data.id,
            updatedAt: new Date().toISOString()
        };

        if (!db) {
            if (isNew) {
                setRecords([recordToSave, ...records]);
            } else {
                setRecords(records.map(r => r.id === recordToSave.id ? recordToSave : r));
            }
            showToast("Data berhasil disimpan.");
            setActiveTab('list');
            return;
        }

        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'health_records', recordToSave.id), recordToSave);
            showToast("Data berhasil disimpan.");
            setActiveTab('list');
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan data.");
        }
    };

    const deleteRecord = async (recordId) => {
        if (!db) {
            setRecords(records.filter(r => r.id !== recordId));
            setSelectedRecord(null);
            showToast("Data dihapus.");
            return;
        }
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'health_records', recordId));
            setSelectedRecord(null);
            showToast("Data dihapus.");
        } catch (e) {
            console.error(e);
        }
    };

    const markAsRecovered = async (recordId, recoveryData) => {
        const record = records.find(r => r.id === recordId);
        if (!record) return;

        const updated = {
            ...record,
            status: 'Sudah sembuh',
            recoveryDate: recoveryData.date,
            recoveryTime: recoveryData.time,
            recoveryNotes: recoveryData.notes,
            updatedAt: new Date().toISOString()
        };

        if (!db) {
            setRecords(records.map(r => r.id === recordId ? updated : r));
            setSelectedRecord(null);
            showToast("Berhasil ditandai sembuh.");
            return;
        }

        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'health_records', recordId), updated);
            setSelectedRecord(null);
            showToast("Berhasil ditandai sembuh.");
        } catch (e) {
            console.error(e);
            showToast("Gagal memperbarui status.");
        }
    };

    const addProgressUpdate = async (recordId, newNoteText) => {
        const record = records.find(r => r.id === recordId);
        if (!record || !newNoteText.trim()) return;

        const now = new Date();
        const newUpdate = {
            id: generateId(),
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().substring(0, 5),
            note: newNoteText
        };

        const updatedUpdates = [...(record.progressUpdates || []), newUpdate];
        const updatedRecord = { ...record, progressUpdates: updatedUpdates, updatedAt: now.toISOString() };

        if (!db) {
            setRecords(records.map(r => r.id === recordId ? updatedRecord : r));
            setSelectedRecord(updatedRecord);
            showToast("Perkembangan berhasil dicatat.");
            return;
        }

        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'health_records', recordId), updatedRecord);
            setSelectedRecord(updatedRecord);
            showToast("Perkembangan berhasil dicatat.");
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan perkembangan.");
        }
    };

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const sick = records.filter(r => r.status === 'Sedang sakit').length;
        const recovering = records.filter(r => r.status === 'Dalam pemulihan').length;
        const recovered = records.filter(r => r.status === 'Sudah sembuh').length;
        const newToday = records.filter(r => r.startDate === today).length;
        
        return { total: records.length, sick, recovering, recovered, newToday };
    }, [records]);

    const handleAdminLogin = (e) => {
        e.preventDefault();
        // Kredensial khusus Admin
        if (loginForm.username === 'hasanali' && loginForm.password === 'poskestrenrahmatika') {
            setRole('admin');
            setShowLogin(false);
            setLoginError('');
            setLoginForm({ username: '', password: '' });
        } else {
            setLoginError('Username atau password salah!');
        }
    };

    const handleLogout = () => {
        setRole(null);
        setShowLogin(false);
        setActiveTab('dashboard');
    };

    if (isAppLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-teal-600">
                <Icons.Activity size={48} className="animate-pulse" />
            </div>
        );
    }

    if (!role) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-slate-100 p-6 px-4 sm:px-6">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] w-full max-w-sm text-center border border-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-[22px] flex items-center justify-center mx-auto mb-6 shadow-[0_10px_25px_rgba(20,184,166,0.4)] rotate-3 hover:rotate-0 transition-transform duration-300">
                            <Icons.Activity size={40} className="drop-shadow-md" />
                        </div>
                        <h1 className="text-3xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent">POSKESTREN</h1>
                        <p className="text-slate-500 mb-8 text-sm font-medium">Pantau kondisi, catat perkembangan.</p>
                        
                        {!showLogin ? (
                            <div className="space-y-4">
                                <button onClick={() => setShowLogin(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-slate-900/20">
                                    Masuk sebagai Admin
                                </button>
                                <button onClick={() => setRole('viewer')} className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 rounded-2xl transition-all active:scale-95 border border-slate-200 shadow-sm">
                                    Lihat Akses Publik
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                {loginError && (
                                    <div className="bg-red-50 text-red-600 text-sm py-3 px-4 rounded-2xl border border-red-100 flex items-center justify-center font-medium">
                                        <Icons.X size={16} className="mr-1.5" /> {loginError}
                                    </div>
                                )}
                                <div className="text-left group">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Username</label>
                                    <input 
                                        type="text" 
                                        placeholder="Username admin"
                                        value={loginForm.username}
                                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                                        autoFocus
                                    />
                                </div>
                                <div className="text-left mb-6 group">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Password admin"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-[0_8px_20px_rgba(20,184,166,0.3)]">
                                    Masuk Admin
                                </button>
                                <button type="button" onClick={() => { setShowLogin(false); setLoginError(''); }} className="w-full bg-transparent text-slate-500 font-semibold py-3 rounded-2xl hover:bg-slate-100 transition-colors">
                                    Kembali
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const Dashboard = () => (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500">
            <header className="pt-4 pb-2 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">POSKESTREN 👋</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Akses: {role === 'admin' ? 'Administrator' : 'Viewer Publik'}</p>
                </div>
                <div className="bg-teal-50 text-teal-700 font-bold px-3.5 py-1.5 rounded-xl text-xs border border-teal-100">
                    {role === 'admin' ? 'Admin Mode' : 'Public View'}
                </div>
            </header>

            <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 rounded-[2.5rem] p-7 text-white shadow-[0_20px_40px_-15px_rgba(20,184,166,0.5)] relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl translate-x-20 -translate-y-20 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="font-semibold text-teal-50 flex items-center tracking-wide"><Icons.Check size={22} className="mr-2 opacity-80"/> Sudah Sembuh</h3>
                    <div className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">Total: {stats.total}</div>
                </div>
                <div className="text-6xl font-black relative z-10 tracking-tighter drop-shadow-md">{stats.recovered}</div>
                <div className="mt-5 flex items-center relative z-10">
                    <div className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/10 flex items-center">
                        Kasus baru hari ini: <span className="font-bold bg-white text-teal-600 px-2 py-0.5 rounded-lg ml-2 shadow-sm">{stats.newToday}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100/50">
                            <Icons.Activity size={24} />
                        </div>
                    </div>
                    <div>
                        <span className="text-sm font-bold text-slate-400 mb-1 block">Sedang Sakit</span>
                        <div className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.sick}</div>
                    </div>
                </div>
                
                <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100/50">
                            <Icons.Activity size={24} />
                        </div>
                    </div>
                    <div>
                        <span className="text-sm font-bold text-slate-400 mb-1 block">Pemulihan</span>
                        <div className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.recovering}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-7 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h3 className="font-extrabold text-slate-800 mb-6 text-lg tracking-tight">Rasio Kondisi Kesehatan</h3>
                {stats.total === 0 ? (
                    <div className="text-center text-slate-400 py-6 text-sm font-medium">Belum ada data tercatat.</div>
                ) : (
                    <>
                        <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                            <div style={{width: `${(stats.sick / stats.total) * 100}%`}} className="bg-gradient-to-r from-red-500 to-rose-400 h-full"></div>
                            <div style={{width: `${(stats.recovering / stats.total) * 100}%`}} className="bg-gradient-to-r from-amber-400 to-orange-400 h-full"></div>
                            <div style={{width: `${(stats.recovered / stats.total) * 100}%`}} className="bg-gradient-to-r from-teal-400 to-teal-500 h-full"></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 mt-5 px-1">
                            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span>Sakit ({(stats.sick/stats.total*100).toFixed(0)}%)</span>
                            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-400 mr-2"></span>Pemulihan ({(stats.recovering/stats.total*100).toFixed(0)}%)</span>
                            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-teal-400 mr-2"></span>Sembuh ({(stats.recovered/stats.total*100).toFixed(0)}%)</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const RecordList = () => {
        const [mode, setMode] = useState('active'); // 'active' atau 'history'
        const [search, setSearch] = useState('');
        const [filterStatus, setFilterStatus] = useState('Semua');

        const filtered = useMemo(() => {
            return records.filter(r => {
                if (mode === 'active' && r.status === 'Sudah sembuh') return false;
                if (mode === 'history' && r.status !== 'Sudah sembuh') return false;
                if (filterStatus !== 'Semua' && r.status !== filterStatus && r.severity !== filterStatus) return false;

                if (search) {
                    const s = search.toLowerCase();
                    return r.name?.toLowerCase().includes(s) || r.mainComplaint?.toLowerCase().includes(s) || r.group?.toLowerCase().includes(s);
                }
                return true;
            });
        }, [search, filterStatus, mode, records]);

        return (
            <div className="pb-24 animate-in fade-in duration-300">
                <header className="pt-4 mb-4">
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Daftar Pasien</h2>
                </header>
                
                <div className="flex bg-slate-200/60 p-1.5 rounded-[1.25rem] mb-5 shadow-inner">
                    <button onClick={() => setMode('active')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'active' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>Sedang Sakit</button>
                    <button onClick={() => setMode('history')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'history' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>Riwayat Sembuh</button>
                </div>

                <div className="sticky top-0 bg-slate-50/90 backdrop-blur-xl z-10 py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="relative mb-4">
                        <Icons.Search className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cari nama, keluhan, atau kelompok..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm font-medium"
                        />
                    </div>
                    {mode === 'active' && (
                        <div className="flex overflow-x-auto hide-scrollbar space-x-2.5 pb-2">
                            {['Semua', 'Sedang sakit', 'Dalam pemulihan', 'Ringan', 'Sedang', 'Berat'].map(f => (
                                <button key={f} onClick={() => setFilterStatus(f)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterStatus === f ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-2 space-y-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                                <Icons.Check size={40} className="text-teal-400" />
                            </div>
                            <p className="font-extrabold text-xl text-slate-700 mb-1">Tidak ada data.</p>
                            <p className="text-sm font-medium text-slate-400">Semua orang dalam kondisi baik 🎉</p>
                        </div>
                    ) : (
                        filtered.map(record => (
                            <div key={record.id} onClick={() => setSelectedRecord(record)}
                                className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${record.severity === 'Berat' ? 'bg-red-500' : record.severity === 'Sedang' ? 'bg-orange-400' : 'bg-amber-300'}`}></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div>
                                        <h4 className="font-extrabold text-slate-800 text-lg tracking-tight mb-0.5">{record.name}</h4>
                                        <p className="text-xs font-semibold text-slate-400">{record.age} thn {record.group ? `• ${record.group}` : ''}</p>
                                    </div>
                                    <div className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold ${STATUS_BADGE[record.status] || STATUS_BADGE['Sedang sakit']}`}>
                                        {record.status}
                                    </div>
                                </div>
                                
                                <div className="space-y-2.5 pl-3">
                                    <div className="flex text-sm">
                                        <span className="w-20 text-slate-400 text-[11px] font-bold uppercase">Keluhan</span>
                                        <span className="font-semibold text-slate-700 flex-1">{record.mainComplaint}</span>
                                    </div>
                                    <div className="flex text-sm items-center">
                                        <span className="w-20 text-slate-400 text-[11px] font-bold uppercase">Mulai</span>
                                        <span className="font-semibold text-slate-700">{formatDate(record.startDate)}</span>
                                    </div>
                                    {mode === 'history' && (
                                        <div className="flex text-sm items-center pt-1">
                                            <span className="w-20 text-slate-400 text-[11px] font-bold uppercase">Durasi</span>
                                            <span className="font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-md">{getDuration(record.startDate, record.recoveryDate)} Hari</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const DataForm = ({ initialData, onCancel }) => {
        const [form, setForm] = useState(initialData || {
            name: '', nickname: '', age: '', gender: 'Laki-laki', group: '',
            startDate: new Date().toISOString().split('T')[0], startTime: '08:00',
            mainComplaint: '', symptoms: '', severity: 'Ringan', status: 'Sedang sakit', notes: '', medication: '', progressUpdates: []
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!form.name || !form.startDate || !form.mainComplaint) {
                showToast("Mohon lengkapi field wajib (*)");
                return;
            }
            saveRecord(form);
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-300">
                <div className="bg-white/80 backdrop-blur-xl px-4 py-4 border-b border-slate-100 flex items-center shadow-sm">
                    <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 mr-2"><Icons.ChevronLeft /></button>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{initialData ? 'Edit Data Pasien' : 'Tambah Pasien Baru'}</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                    <form id="healthForm" onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h3 className="font-extrabold text-teal-700 mb-6 flex items-center text-lg"><Icons.Users size={20} className="mr-2"/> Data Pribadi</h3>
                            <FormInput label="Nama Lengkap" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Contoh: Ahmad Rizky" />
                            <div className="grid grid-cols-2 gap-5">
                                <FormInput label="Umur" type="number" required value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="Umur" />
                                <FormInput label="Gender" type="select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                                    <option>Laki-laki</option><option>Perempuan</option>
                                </FormInput>
                            </div>
                            <FormInput label="Kelas/Kelompok/Divisi" value={form.group} onChange={e => setForm({...form, group: e.target.value})} placeholder="Opsional" />
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h3 className="font-extrabold text-teal-700 mb-6 flex items-center text-lg"><Icons.Activity size={20} className="mr-2"/> Informasi Sakit</h3>
                            <div className="grid grid-cols-2 gap-5">
                                <FormInput label="Tgl Mulai Sakit" type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                                <FormInput label="Jam Mulai" type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                            </div>
                            <FormInput label="Keluhan Utama" required value={form.mainComplaint} onChange={e => setForm({...form, mainComplaint: e.target.value})} placeholder="Misal: Demam tinggi" />
                            <FormInput label="Gejala Detail" type="textarea" value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} placeholder="Misal: Badan lemas, batuk kering..." />
                            
                            <FormInput label="Tindakan / Obat yang Diberikan" type="textarea" value={form.medication} onChange={e => setForm({...form, medication: e.target.value})} placeholder="Misal: Paracetamol 3x1, Vitamin C" />
                            
                            <div className="mb-6">
                                <label className="block text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Tingkat Kondisi</label>
                                <div className="flex space-x-3">
                                    {['Ringan', 'Sedang', 'Berat'].map(lvl => (
                                        <button type="button" key={lvl} onClick={() => setForm({...form, severity: lvl})}
                                            className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all ${form.severity === lvl ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <FormInput label="Status Saat Ini" type="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                <option>Sedang sakit</option>
                                <option>Dalam pemulihan</option>
                                {initialData && <option>Sudah sembuh</option>}
                            </FormInput>
                        </div>
                    </form>
                </div>

                <div className="bg-white/90 backdrop-blur-md border-t border-slate-100 p-4 shadow-lg flex-shrink-0">
                    <button form="healthForm" type="submit" className="w-full max-w-2xl mx-auto block bg-gradient-to-r from-teal-600 to-teal-500 text-white font-extrabold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg">
                        Simpan Data
                    </button>
                </div>
            </div>
        );
    };

    const DetailModal = () => {
        const [showRecoverModal, setShowRecoverModal] = useState(false);
        const [recData, setRecData] = useState({ date: new Date().toISOString().split('T')[0], time: '12:00', notes: 'Kondisi telah pulih sepenuhnya.' });
        const [newProgressNote, setNewProgressNote] = useState('');

        if (!selectedRecord) return null;
        const r = selectedRecord;

        const handleSaveProgress = () => {
            if (newProgressNote.trim()) {
                addProgressUpdate(r.id, newProgressNote);
                setNewProgressNote('');
            }
        };

        return (
            <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-300">
                <div className="bg-white/80 backdrop-blur-xl px-4 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center">
                        <button onClick={() => setSelectedRecord(null)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 mr-2"><Icons.ChevronLeft /></button>
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Detail Pasien</h2>
                    </div>
                    {role === 'admin' && (
                        <div className="flex space-x-1">
                            <button onClick={() => { setSelectedRecord(null); setEditMode(r); }} className="p-2 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-full"><Icons.Edit size={20} /></button>
                            <button onClick={() => { if(window.confirm('Hapus data ini?')) deleteRecord(r.id); }} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full"><Icons.Trash size={20} /></button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                    <div className="max-w-2xl mx-auto space-y-5">
                        <div className="bg-white rounded-[2.5rem] p-7 text-center shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-2.5 ${r.status === 'Sudah sembuh' ? 'bg-teal-500' : r.status === 'Dalam pemulihan' ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[1.5rem] mx-auto mb-5 flex items-center justify-center text-4xl font-black text-slate-400 shadow-inner">
                                {r.name.charAt(0)}
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{r.name}</h3>
                            <p className="text-slate-500 font-medium">{r.age} tahun • {r.group || '-'}</p>
                            
                            <div className={`inline-flex items-center mt-6 px-6 py-2.5 rounded-full text-sm font-bold tracking-wide shadow-sm ${STATUS_BADGE[r.status]}`}>
                                {r.status}
                            </div>

                            {role === 'admin' && r.status !== 'Sudah sembuh' && (
                                <div className="mt-6">
                                    <button onClick={() => setShowRecoverModal(true)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center">
                                        <Icons.Check size={20} className="mr-2" /> Tandai Sudah Sembuh
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 space-y-7">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Keluhan Utama</p>
                                <p className="text-2xl font-extrabold text-slate-800 leading-tight">{r.mainComplaint}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-3xl border border-slate-100/50">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Mulai Sakit</p>
                                    <p className="font-bold text-slate-800">{formatDate(r.startDate)}</p>
                                    <p className="text-sm font-medium text-slate-500">{r.startTime}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kondisi</p>
                                    <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-bold border ${COLORS[r.severity]}`}>
                                        {r.severity}
                                    </span>
                                </div>
                            </div>

                            {r.symptoms && (
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gejala Detail</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl">{r.symptoms}</p>
                                </div>
                            )}

                            {r.medication && (
                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center"><Icons.Pill size={14} className="mr-1.5"/> Tindakan / Obat</p>
                                    <p className="text-sm font-medium text-teal-700 leading-relaxed bg-teal-50 p-4 rounded-2xl border border-teal-100">{r.medication}</p>
                                </div>
                            )}

                            {r.status === 'Sudah sembuh' && (
                                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-[2rem] p-6 border border-teal-100">
                                    <h4 className="font-extrabold text-teal-800 mb-4 flex items-center text-lg"><Icons.Check size={20} className="mr-2"/> Info Kesembuhan</h4>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">Tgl Sembuh</p>
                                            <p className="font-bold text-teal-900">{formatDate(r.recoveryDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">Durasi Total</p>
                                            <p className="font-extrabold text-teal-900 text-xl">{getDuration(r.startDate, r.recoveryDate)} Hari</p>
                                        </div>
                                    </div>
                                    {r.recoveryNotes && (
                                        <p className="mt-4 text-sm font-medium text-teal-800 bg-white/60 p-3 rounded-xl">{r.recoveryNotes}</p>
                                    )}
                                </div>
                            )}

                            {/* Timeline Update Perkembangan */}
                            <div className="border-t border-slate-100 pt-6">
                                <h4 className="font-extrabold text-slate-800 mb-4 flex items-center text-lg"><Icons.Activity size={20} className="mr-2 text-teal-500"/> Catatan Perkembangan</h4>
                                
                                <div className="space-y-4">
                                    {(r.progressUpdates || []).length === 0 ? (
                                        <p className="text-sm text-slate-400 font-medium italic">Belum ada catatan perkembangan harian.</p>
                                    ) : (
                                        (r.progressUpdates || []).map((update, idx) => (
                                            <div key={update.id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-teal-600 flex items-center"><Icons.Clock size={12} className="mr-1"/> {formatDate(update.date)}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{update.time}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{update.note}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {role === 'admin' && r.status !== 'Sudah sembuh' && (
                                    <div className="mt-5 flex space-x-2">
                                        <input 
                                            type="text" 
                                            value={newProgressNote}
                                            onChange={(e) => setNewProgressNote(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveProgress()}
                                            placeholder="Tambah update harian..."
                                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none font-medium shadow-sm"
                                        />
                                        <button onClick={handleSaveProgress} disabled={!newProgressNote.trim()} className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white px-4 rounded-xl font-bold shadow-sm flex items-center justify-center">
                                            <Icons.Plus size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recovery Modal Popup */}
                {showRecoverModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-extrabold text-slate-800">Tandai Sudah Sembuh 🎉</h3>
                            <div className="space-y-4">
                                <FormInput label="Tanggal Sembuh" type="date" value={recData.date} onChange={e => setRecData({...recData, date: e.target.value})} />
                                <FormInput label="Jam Sembuh" type="time" value={recData.time} onChange={e => setRecData({...recData, time: e.target.value})} />
                                <FormInput label="Catatan Kesembuhan" type="textarea" value={recData.notes} onChange={e => setRecData({...recData, notes: e.target.value})} />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button onClick={() => setShowRecoverModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-colors">Batal</button>
                                <button onClick={() => markAsRecovered(r.id, recData)} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all">Simpan Sembuh</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const MagazineTab = () => (
        <div className="pb-24 animate-in fade-in duration-300">
            <header className="pt-4 mb-6">
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Majalah Kesehatan</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Tips kesehatan harian dan pencegahan penyakit.</p>
            </header>

            <div className="space-y-5">
                {ARTICLES.map(article => (
                    <div key={article.id} onClick={() => setSelectedArticle(article)}
                        className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer group">
                        <div className={`h-40 w-full rounded-2xl bg-gradient-to-br ${article.imageGradient} mb-4 relative flex items-center justify-center`}>
                            <Icons.BookOpen size={48} className="text-white opacity-20 absolute" />
                            <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20">
                                {article.category}
                            </div>
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-2 group-hover:text-teal-600 transition-colors px-2">{article.title}</h3>
                        <div className="flex items-center text-xs font-bold text-slate-400 px-2 pb-1">
                            <span>{article.date}</span>
                            <span className="mx-2">•</span>
                            <span>{article.readTime} baca</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const ArticleReader = () => {
        if (!selectedArticle) return null;
        const a = selectedArticle;

        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
                <div className={`h-72 w-full bg-gradient-to-br ${a.imageGradient} relative flex-shrink-0`}>
                    <Icons.BookOpen size={120} className="text-white opacity-10 absolute right-4 top-1/2 -translate-y-1/2" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                    <div className="absolute top-4 left-4 z-10">
                        <button onClick={() => setSelectedArticle(null)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 border border-white/10">
                            <Icons.ChevronLeft />
                        </button>
                    </div>
                    <div className="absolute bottom-8 left-6 right-6 z-10">
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 inline-block mb-3">
                            {a.category}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{a.title}</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pb-32 bg-white -mt-6 rounded-t-[2.5rem] relative z-20 shadow-xl">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mr-3 border border-teal-100">
                                <Icons.Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-slate-800">{a.author}</p>
                                <p className="text-xs text-slate-400 font-bold">{a.date} • {a.readTime} baca</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {a.content.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="text-[15px] font-medium text-slate-600 leading-relaxed">{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-teal-200">
            <main className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4 w-full pb-[120px]">
                {editMode ? (
                    <DataForm initialData={editMode} onCancel={() => setEditMode(null)} />
                ) : (
                    <>
                        {activeTab === 'dashboard' && <Dashboard />}
                        {activeTab === 'list' && <RecordList />}
                        {activeTab === 'magazine' && <MagazineTab />}
                        {activeTab === 'add' && <DataForm onCancel={() => setActiveTab('list')} />}
                        {activeTab === 'settings' && (
                            <div className="space-y-6 pt-4 pb-24 animate-in fade-in">
                                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Pengaturan</h2>
                                <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 space-y-2">
                                    <div className="p-6 bg-slate-50 rounded-3xl mb-4 text-center border border-slate-100/50">
                                        <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm">
                                            <Icons.Settings size={28} className="text-slate-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">Akses Saat Ini</p>
                                        <p className={`font-black text-xl tracking-tight ${role === 'admin' ? 'text-teal-600' : 'text-slate-700'}`}>
                                            {role === 'admin' ? 'Administrator' : 'Viewer Publik'}
                                        </p>
                                    </div>
                                    <button onClick={handleLogout} className="w-full flex items-center justify-between p-5 hover:bg-red-50 rounded-2xl transition-colors text-red-600 font-bold">
                                        <span>Keluar / Ganti Peran</span>
                                        <Icons.ChevronLeft className="rotate-180 opacity-50" size={20}/>
                                    </button>
                                </div>
                                <p className="text-center text-[11px] text-slate-400 mt-10 font-bold uppercase tracking-wider">POSKESTREN v2.5 • Secured App</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {selectedRecord && !editMode && <DetailModal />}
            <ArticleReader />

            {toastMsg && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center animate-in slide-in-from-top-4 fade-in duration-300 border border-slate-700">
                    <Icons.Check size={18} className="mr-2 text-teal-400" />
                    <span className="text-sm font-bold tracking-wide">{toastMsg}</span>
                </div>
            )}

            {/* Bottom Navigation */}
            {!selectedRecord && !editMode && !selectedArticle && activeTab !== 'add' && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/85 backdrop-blur-xl border-t border-slate-100 pb-safe">
                    <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-6 py-2 flex justify-between items-center">
                        {[
                            { id: 'dashboard', icon: Icons.Home, label: 'Beranda' },
                            { id: 'list', icon: Icons.Users, label: 'Pasien' }
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 transition-all ${activeTab === item.id ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
                                <item.icon size={24} className={activeTab === item.id ? 'stroke-[2.5px]' : ''} />
                                <span className="text-[10px] font-bold mt-1.5">{item.label}</span>
                            </button>
                        ))}
                        
                        {role === 'admin' && (
                            <div className="relative -top-8">
                                <button onClick={() => setActiveTab('add')}
                                    className="bg-gradient-to-tr from-teal-500 to-teal-600 text-white p-4 rounded-[1.5rem] shadow-[0_10px_25px_rgba(20,184,166,0.4)] active:scale-95 transition-transform rotate-3 hover:rotate-0 border-[4px] border-white/50">
                                    <Icons.Plus size={30} className="stroke-[3px]" />
                                </button>
                            </div>
                        )}
                        
                        {[
                            { id: 'magazine', icon: Icons.BookOpen, label: 'Majalah' },
                            { id: 'settings', icon: Icons.Settings, label: 'Atur' }
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 transition-all ${activeTab === item.id ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
                                <item.icon size={24} className={activeTab === item.id ? 'stroke-[2.5px]' : ''} />
                                <span className="text-[10px] font-bold mt-1.5">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
                .pt-safe { padding-top: env(safe-area-inset-top, 0px); }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                body { -webkit-tap-highlight-color: transparent; overscroll-behavior-y: none; }
            `}} />
        </div>
    );
}
