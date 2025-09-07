import React, { useState, useEffect } from 'react';
import MainBody from '../components/MainBody';
import { FaEdit, FaTrash, FaStickyNote, FaInfoCircle } from 'react-icons/fa';
import ModalNotes from './Extra/Batches/Modal_Notes';
import Detail from './Extra/Batches/Detail';
import axios from 'axios';
import { message } from 'antd';
import dayjs from 'dayjs';


interface Batch {
    batchID: number;
    batchName: string;
    startDate: string;
    expectedHarvestDate: string;
    totalChicken: number;
    currentChicken: number;
    status: string;
    notes?: {
        String: string;
        Valid: boolean;
    };
}

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVERHOST,
    timeout: 10000,
});

const Batches: React.FC = () => {
    const [selectedNote, setSelectedNote] = useState<{
        note: string;
        title: string;
    } | null>(null);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchBatches = async () => {
            setLoading(true);
            try {
                const response = await api.get('/api/batches');
                setBatches(response.data || []);
            } catch (error) {
                message.error('Failed to fetch batches.');
            } finally {
                setLoading(false);
            }
        };

        fetchBatches();
    }, []);

    const formatDate = (dateString: string) => {
        return dayjs(dateString).format('MMM D, YYYY');
    };

    const handleViewDetails = (batch: Batch) => {
        setSelectedBatch(batch);
    };

    if (loading) {
        return (
            <MainBody>
                <div>Loading batches...</div>
            </MainBody>
        );
    }

    return (
        <MainBody>
            <ModalNotes
                isOpen={!!selectedNote}
                onClose={() => setSelectedNote(null)}
                note={selectedNote?.note || ''}
                title={selectedNote?.title || 'Note Details'}
            />

            <Detail
                isOpen={!!selectedBatch}
                onClose={() => setSelectedBatch(null)}
                batch={selectedBatch}
            />

            <div className='space-y-6'>
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Batch ID
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Batch Name
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Start Date
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Expected Harvest
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Total
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Current
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Status
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Notes
                                    </th>
                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className='bg-white divide-y divide-gray-200'>
                                {batches.map((batch) => (
                                    // CORRECTED: All property access is now camelCase (e.g., batch.batchID)
                                    <tr
                                        key={batch.batchID}
                                        className='hover:bg-gray-50'
                                    >
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                            {batch.batchID}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                            {batch.batchName}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                            {formatDate(batch.startDate)}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                            {formatDate(
                                                batch.expectedHarvestDate
                                            )}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                            {batch.totalChicken.toLocaleString()}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                            {batch.currentChicken.toLocaleString()}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    batch.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <button
                                                onClick={() => {
                                                    if (batch.notes?.Valid) {
                                                        setSelectedNote({
                                                            note: batch.notes
                                                                .String,
                                                            title: `Notes for ${batch.batchName} (${batch.batchID})`,
                                                        });
                                                    }
                                                }}
                                                className={`inline-flex items-center text-sm ${batch.notes?.Valid ? 'text-blue-600 hover:underline' : 'text-gray-400'}`}
                                                disabled={!batch.notes?.Valid}
                                            >
                                                <FaStickyNote className='mr-1.5 h-4 w-4' />
                                                {batch.notes?.Valid
                                                    ? 'View Notes'
                                                    : 'No Notes'}
                                            </button>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                            <div className='flex justify-end space-x-2'>
                                                <button
                                                    className='inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                                                    onClick={() =>
                                                        handleViewDetails(batch)
                                                    }
                                                >
                                                    <FaInfoCircle className='mr-1.5 h-4 w-4' />
                                                    Details
                                                </button>
                                                <button
                                                    className='inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                                                    onClick={() =>
                                                        console.log(
                                                            'Edit',
                                                            batch.batchID
                                                        )
                                                    }
                                                >
                                                    <FaEdit className='mr-1.5 h-4 w-4' />
                                                    Edit
                                                </button>
                                                <button
                                                    className='inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-red-50'
                                                    onClick={() =>
                                                        console.log(
                                                            'Delete',
                                                            batch.batchID
                                                        )
                                                    }
                                                >
                                                    <FaTrash className='mr-1.5 h-4 w-4' />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainBody>
    );
};

export default Batches;
