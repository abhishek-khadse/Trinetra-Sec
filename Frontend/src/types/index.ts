export type User = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
};

export type FileScan = {
  id: string;
  created_at: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  scan_status: 'pending' | 'scanning' | 'completed' | 'failed';
  result_summary: string | null;
  threat_level: 'none' | 'low' | 'medium' | 'high' | 'critical' | null;
  detection_count: number | null;
};

export type ThreatFeed = {
  id: string;
  created_at: string;
  feed_type: 'malware' | 'phishing' | 'ransomware' | 'vulnerability' | 'exploit';
  threat_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ioc_type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  ioc_value: string;
  description: string | null;
  source: string | null;
  is_active: boolean;
};

export type MenuItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
};

export type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
};

export type Stats = {
  total_scans: number;
  threats_detected: number;
  active_threats: number;
  blocked_attacks: number;
};

export type MitreAttackCategory = {
  id: string;
  name: string;
  description: string;
  techniques: MitreTechnique[];
};

export type MitreTechnique = {
  id: string;
  name: string;
  description: string;
};