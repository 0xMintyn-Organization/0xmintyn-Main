/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// Pagination component removed - marketplace deleted
import PurchasedProductCard from "@/components/Purchased/PurchasedProductCard";
import Protected from "@/hooks/useProtected";
import { useGetAllOrdersQuery } from "@/redux/features/order/orderApi";
import { useEffect, useState } from "react";

function PurchasedCourses() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isSuccess } = useGetAllOrdersQuery({
    page: currentPage,
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isSuccess) {
      setCourses(data.products); // ✅ Correct
      setTotalPages(data.totalPages);
    }
  }, [data, isSuccess]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-semibold">Loading...</h1>
      </div>
    );
  }

  return (
    <Protected>
      <div className="flex flex-col mx-auto py-6 px-4 w-full max-w-7xl">
        <div className="space-y-4 mb-8">
          <h2 className="text-3xl font-bold">My Purchased Courses</h2>
          <p className="text-gray-500">
            You have {data?.productsCount || 0} purchased {data?.productsCount === 1 ? 'course' : 'courses'}.
          </p>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <PurchasedProductCard
                key={course._id}
                imagePath={course.coverImage}
                type={course.type}
                currency={course.currency}
                imageAltText={course.title}
                profileImage={course.createdBy?.avatar}
                profileName={`${course.createdBy?.firstName} ${course.createdBy?.lastName}`}
                title={course.title}
                price={course.amount}
                description={course.description}
              />
            ))}
          </div>
        ) : (
          <div className="text-center mt-12">
            <h3 className="text-lg font-semibold">No courses purchased yet.</h3>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded ${
                  currentPage === page
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </Protected>
  );
}

export default PurchasedCourses;
