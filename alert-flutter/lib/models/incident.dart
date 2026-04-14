class Incident {
  final String id;
  final String? userId;
  final String title;
  final String description;
  final String category;
  final String severity;
  final String status;
  final double latitude;
  final double longitude;
  final bool isVerified;
  final bool isFake;
  final int confirmCount;
  final int denyCount;
  final int views;
  final String reporterName;
  final int reporterLevel;
  final DateTime createdAt;

  Incident({
    required this.id,
    this.userId,
    required this.title,
    this.description = '',
    this.category = 'other',
    this.severity = 'medium',
    this.status = 'active',
    required this.latitude,
    required this.longitude,
    this.isVerified = false,
    this.isFake = false,
    this.confirmCount = 0,
    this.denyCount = 0,
    this.views = 0,
    this.reporterName = '',
    this.reporterLevel = 0,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Incident.fromJson(Map<String, dynamic> json) {
    return Incident(
      id: json['id'] ?? '',
      userId: json['user_id'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'other',
      severity: json['severity'] ?? 'medium',
      status: json['status'] ?? 'active',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      isVerified: json['is_verified'] ?? false,
      isFake: json['is_fake'] ?? false,
      confirmCount: json['confirm_count'] ?? 0,
      denyCount: json['deny_count'] ?? 0,
      views: json['views'] ?? 0,
      reporterName: json['reporter_name'] ?? json['reporterName'] ?? '',
      reporterLevel: json['reporter_level'] ?? json['reporterLevel'] ?? 0,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
    );
  }
}

class TrackedItem {
  final String id;
  final String name;
  final String itemType;
  final String icon;
  final double? latitude;
  final double? longitude;

  TrackedItem({required this.id, required this.name, required this.itemType, this.icon = 'map-marker', this.latitude, this.longitude});

  factory TrackedItem.fromJson(Map<String, dynamic> json) {
    return TrackedItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      itemType: json['item_type'] ?? 'tag',
      icon: json['icon'] ?? 'map-marker',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );
  }
}
