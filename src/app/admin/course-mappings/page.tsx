"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@nextui-org/react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

interface CourseMapping {
  id: string;
  course_id: string;
  woo_sku: string;
  woo_product_id?: number | null;
  woo_product_name?: string;
  price?: number | null;
  is_active: boolean;
  course?: Course;
}

export default function CourseMappingsPage() {
  const [mappings, setMappings] = useState<CourseMapping[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMapping, setNewMapping] = useState({
    course_id: "",
    woo_sku: "",
    woo_product_id: "",
    woo_product_name: "",
    price: "",
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .order('title');

      if (coursesData) {
        setCourses(coursesData);
      }

      // Load mappings with course data
      const { data: mappingsData } = await supabase
        .from('course_sku_mappings')
        .select(`
          *,
          course:course_id(id, title)
        `)
        .order('created_at', { ascending: false });

      if (mappingsData) {
        setMappings(mappingsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (mapping: CourseMapping) => {
    try {
      const { error } = await supabase
        .from('course_sku_mappings')
        .update({
          course_id: mapping.course_id,
          woo_sku: mapping.woo_sku,
          woo_product_id: mapping.woo_product_id || null,
          woo_product_name: mapping.woo_product_name || null,
          price: mapping.price || null,
          is_active: mapping.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', mapping.id);

      if (error) throw error;

      setEditingId(null);
      loadData();
    } catch (error) {
      console.error("Error updating mapping:", error);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('course_sku_mappings')
        .insert({
          course_id: newMapping.course_id,
          woo_sku: newMapping.woo_sku,
          woo_product_id: newMapping.woo_product_id ? parseInt(newMapping.woo_product_id) : null,
          woo_product_name: newMapping.woo_product_name || null,
          price: newMapping.price ? parseFloat(newMapping.price) : null,
          is_active: newMapping.is_active
        });

      if (error) throw error;

      setNewMapping({
        course_id: "",
        woo_sku: "",
        woo_product_id: "",
        woo_product_name: "",
        price: "",
        is_active: true
      });
      loadData();
    } catch (error) {
      console.error("Error creating mapping:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haluatko varmasti poistaa tämän kytkennän?")) return;

    try {
      const { error } = await supabase
        .from('course_sku_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error("Error deleting mapping:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Ladataan...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kurssi-SKU Kytkennät</h1>
        <p className="text-gray-600">Hallitse WooCommerce tuotteiden kytkentöjä kursseihin</p>
      </div>

      {/* New Mapping Form */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Lisää uusi kytkentä</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kurssi</label>
            <select
              value={newMapping.course_id}
              onChange={(e) => setNewMapping({ ...newMapping, course_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-red-800 focus:outline-none"
            >
              <option value="">Valitse kurssi</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WooCommerce SKU</label>
            <input
              type="text"
              value={newMapping.woo_sku}
              onChange={(e) => setNewMapping({ ...newMapping, woo_sku: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-red-800 focus:outline-none"
              placeholder="esim. KURSSI-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tuote ID (valinnainen)</label>
            <input
              type="number"
              value={newMapping.woo_product_id}
              onChange={(e) => setNewMapping({ ...newMapping, woo_product_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-red-800 focus:outline-none"
              placeholder="12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hinta (valinnainen)</label>
            <input
              type="number"
              step="0.01"
              value={newMapping.price}
              onChange={(e) => setNewMapping({ ...newMapping, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:border-red-800 focus:outline-none"
              placeholder="99.00"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newMapping.is_active}
              onChange={(e) => setNewMapping({ ...newMapping, is_active: e.target.checked })}
              className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Aktiivinen</span>
          </label>

          <Button
            onClick={handleCreate}
            disabled={!newMapping.course_id || !newMapping.woo_sku}
            className="bg-red-800 hover:bg-red-900 text-white"
            startContent={<Plus className="w-4 h-4" />}
          >
            Lisää kytkentä
          </Button>
        </div>
      </div>

      {/* Mappings List */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Olemassa olevat kytkennät</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurssi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuote ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hinta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tila</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toiminnot</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === mapping.id ? (
                      <select
                        value={mapping.course_id}
                        onChange={(e) => setMappings(mappings.map(m => 
                          m.id === mapping.id ? { ...m, course_id: e.target.value } : m
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 focus:border-red-800 focus:outline-none"
                      >
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {mapping.course?.title || 'Tuntematon kurssi'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === mapping.id ? (
                      <input
                        type="text"
                        value={mapping.woo_sku}
                        onChange={(e) => setMappings(mappings.map(m => 
                          m.id === mapping.id ? { ...m, woo_sku: e.target.value } : m
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 focus:border-red-800 focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{mapping.woo_sku}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === mapping.id ? (
                      <input
                        type="number"
                        value={mapping.woo_product_id || ''}
                        onChange={(e) => setMappings(mappings.map(m => 
                          m.id === mapping.id ? { ...m, woo_product_id: e.target.value ? parseInt(e.target.value) : null } : m
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 focus:border-red-800 focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{mapping.woo_product_id || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === mapping.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={mapping.price || ''}
                        onChange={(e) => setMappings(mappings.map(m => 
                          m.id === mapping.id ? { ...m, price: e.target.value ? parseFloat(e.target.value) : null } : m
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 focus:border-red-800 focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {mapping.price ? `€${mapping.price.toFixed(2)}` : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === mapping.id ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={mapping.is_active}
                          onChange={(e) => setMappings(mappings.map(m => 
                            m.id === mapping.id ? { ...m, is_active: e.target.checked } : m
                          ))}
                          className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">Aktiivinen</span>
                      </label>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        mapping.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mapping.is_active ? 'Aktiivinen' : 'Ei aktiivinen'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === mapping.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(mapping)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          startContent={<Save className="w-4 h-4" />}
                        >
                          Tallenna
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => setEditingId(null)}
                          className="text-gray-600"
                          startContent={<X className="w-4 h-4" />}
                        >
                          Peruuta
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => setEditingId(mapping.id)}
                          className="text-blue-600 hover:text-blue-800"
                          startContent={<Edit className="w-4 h-4" />}
                        >
                          Muokkaa
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => handleDelete(mapping.id)}
                          className="text-red-600 hover:text-red-800"
                          startContent={<Trash2 className="w-4 h-4" />}
                        >
                          Poista
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
