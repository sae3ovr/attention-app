class UserProfile {
  final String id;
  final String email;
  final String displayName;
  final int reputation;
  final int level;
  final bool isGuardian;
  final bool isGhostMode;
  final int totalReports;
  final int totalConfirmations;
  final int reportsToday;
  final int dailyReportLimit;
  final int verifiedIncidents;
  final int removedIncidents;
  final int mentees;

  const UserProfile({
    required this.id,
    required this.email,
    required this.displayName,
    this.reputation = 0,
    this.level = 0,
    this.isGuardian = false,
    this.isGhostMode = false,
    this.totalReports = 0,
    this.totalConfirmations = 0,
    this.reportsToday = 0,
    this.dailyReportLimit = 5,
    this.verifiedIncidents = 0,
    this.removedIncidents = 0,
    this.mentees = 0,
  });

  UserProfile copyWith({String? id, String? email, String? displayName, int? reputation, int? level, bool? isGuardian, bool? isGhostMode, int? totalReports, int? totalConfirmations, int? reportsToday, int? dailyReportLimit, int? verifiedIncidents, int? removedIncidents, int? mentees}) =>
    UserProfile(
      id: id ?? this.id, email: email ?? this.email, displayName: displayName ?? this.displayName,
      reputation: reputation ?? this.reputation, level: level ?? this.level, isGuardian: isGuardian ?? this.isGuardian,
      isGhostMode: isGhostMode ?? this.isGhostMode, totalReports: totalReports ?? this.totalReports,
      totalConfirmations: totalConfirmations ?? this.totalConfirmations, reportsToday: reportsToday ?? this.reportsToday,
      dailyReportLimit: dailyReportLimit ?? this.dailyReportLimit, verifiedIncidents: verifiedIncidents ?? this.verifiedIncidents,
      removedIncidents: removedIncidents ?? this.removedIncidents, mentees: mentees ?? this.mentees,
    );

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? '',
      reputation: json['reputation'] ?? 0,
      level: json['level'] ?? 0,
      isGuardian: json['isGuardian'] ?? json['is_guardian'] ?? false,
      isGhostMode: json['isGhostMode'] ?? json['is_ghost_mode'] ?? false,
      totalReports: json['totalReports'] ?? json['total_reports'] ?? 0,
      totalConfirmations: json['totalConfirmations'] ?? json['total_confirmations'] ?? 0,
      reportsToday: json['reportsToday'] ?? json['reports_today'] ?? 0,
      dailyReportLimit: json['dailyReportLimit'] ?? json['daily_report_limit'] ?? 5,
      verifiedIncidents: json['verifiedIncidents'] ?? json['verified_incidents'] ?? 0,
      removedIncidents: json['removedIncidents'] ?? json['removed_incidents'] ?? 0,
      mentees: json['mentees'] ?? 0,
    );
  }
}
